# devcampka2016-hko


Session "Performance Monitoring von NodeJS Web-Apps mit dem ELK Stack"
im [DevCamp Karlsruhe 2016](http://www.campus-devcamp.de/devcamp-karlsruhe-23-24-09-2016/)

## Worum geht es?

Die Session will zeigen, wie man eine in NodeJS implementierte Web-App/
-Server mit einfachen Mitteln via dem Elastic Stack montioren kann. 
Dabei geht es unter anderem, um die Aufzeichnung der Antwortzeiten sowie der 
Anzahl der Requests.

Als Demo dient eine einfache REST-API mit drei Endpunkten die JSON 
zurückliefert. Anzahl und Antwortzeiten dieser API werden "near realtime"
via Logstash an einen Elasticsearch Index geliefert und mit Kibana
visualisiert. Um in der Session Last auf der API zu erzeugen, wird das
Tool ["Vegeta"](https://github.com/tsenart/vegeta) verwendet.

## Vorraussetzungen

* [NodeJS](https://nodejs.org/en/) 
* [Elastic Stack (früher ELK Stack)](https://www.elastic.co/de/webinars/introduction-elk-stack)

### Downloads

* NodeJS: https://nodejs.org/en/ 
* Elasticsearch: https://www.elastic.co/downloads/elasticsearch
* Logstash: https://www.elastic.co/downloads/logstash
* Kibana: https://www.elastic.co/downloads/kibana
* Vegeta: https://github.com/tsenart/vegeta

## 1. Schritt

Installieren des [ExpressJS ](http://expressjs.com/) Frameworks mit dem
integrierten [Generator](http://expressjs.com/en/starter/generator.html)

Damit ist ein einfacher HTTP Server aufgesetzt, der eine (zunächst)
leere Webseite unter [/](http://locahost:3000) ausgibt.

## 2. Schritt

Implementierung einer API zur Demonstration. Als Basis dienen Fragen und
Antworten aus dem Kartenspiel ["Cards Against Humanity"](https://cardsagainsthumanity.com/)
Es wird eine neue Route "/api" zugefügt, die die Endpunkte /api/answer,
/api/question und /api/pick bereitstellt. Die Endpunkte wählen jeweils
einen zufälligen Datensatz (Karten aus dem Spiel) aus und liefern ihn 
als JSON zurück.

Die Default [Startseite ("Homepage")](/views/index.ejs)  wird angepasst, so dass
alle drei API Requests im Browser ausprobiert werden können.

Die API wird als sog. Route in [cards.js](/routes/cards.js) angelegt und
enthält die drei möglichen Endpunkte, die sich die Daten aus einem [Array](/lib/cards.js)
holt.

```javascript
// API endpoints - requests goes here
router.get('/:endpoint', function(req, res, next) {
    if (req.params.endpoint === 'question') {
        res.status(200).send({ question: question() });
    } else if (req.params.endpoint === 'answer') {
        res.status(200).send({ answer: answer() });
    } else if (req.params.endpoint === 'pick') {
        res.status(200).send(pick());
    } else {
        res.status(404).send({ error: 'Not found' })
    }
    next();
});
```

Die neuen Routen werden in der [app.js](/app.js) zugefügt:
```javascript
app.use('/api', apiRoutes); 
```

Der Rest der generierten App bleibt zunächst unverändert.


## 3. Schritt

### Elastic Stack einrichten

Zunächst wird der Elastic Stack gestartet. Nach dem Download der drei
Pakete (Elasticsearch, Logstash und Kibana) einfach die Archive 
entpacken und im jeweiligen <paket>/bin Verzeichnis aufrufen. 
In der Reihenfolge muss zunächst Elasticsearch und dann Kibana gestartet
werden - Kibana wird dann automatisch Verbindung zum nun laufenden lokalen
Elasticsearch Server aufnehmen.
Logstash hingegen muss zunächst konfiguriert werden.

### Logstash konfigurieren

Logstash benötigt eine sog. Pipeline-Konfiguration [siehe Dokumentation](https://www.elastic.co/guide/en/logstash/current/advanced-pipeline.html)
Konfiguriert wird ein "Input" und ein "Output":
```
input {
     tcp {
        codec => "json"
        port => "3515"
     }
}
```

Als "Input" wird das TCP-Plugin via JSON Code benutzt, beides wird mitgeliefert.
Es wird lediglich noch der Port konfiguriert, auf dem Logstash lauschen soll

```
output {
    stdout {
        codec => json
    }
    elasticsearch {
        hosts => [ "localhost:9200" ]
    }
}
```

Als "Output" wird zunächst stdout für Debugging-Zwecke angelegt, damit wird 
jeder Request an Logstash auf der Konsole gespiegelt. Dann wird das Elasticsearch
Plugin (ebenfalls im Lieferumfang) benutzt, bei dem man nur Adresse und Port der
zu benutzenden Elasticsearch Installation angeben muss (hier stehen die Default 
 Werte aus dem Elasticsearch Paket)
 
Die Konfiguration findet sich hier [pipeline.conf](/docs/logstash/pipeline.conf)
 
Nun kann auch Logstash gestartet werden.

### Implementation in die ExpressJS Welt

Zunächst wird ein Handler erzeugt, der die Nachrichten zusammen baut
und an Logstash versendet: [logstash.js](/lib/logstash.js)

Dieses Modul übernimmt das Aufbauen der Verbindung, das Zusammensetzen der 
Nachricht (also des Log-Eintrages) und das Versenden desselben.

Jeder Eintrag wird als JSON versendet und kann beliebige Felder enthalten, hier 
werden folgende verwendet:

* request_start: Startzeitpunkt des Requests
* request_method: Die Methode, hier gibt es nur GET
* request_uri: Der Pfad
* response_statuscode: Der Statuscode, mit dem der Request beantwortet wurde
* user_agent: Der User-Agent des Clients
* duration: Die Dauer des Requests in der Verarbeitung
* host: Der Quell-Host
* type: Bezeichnet die Herkunft und kann beliebig sein, nützlich zum Filtern

Logstash selbst fügt noch weitere Felder hinzu, wie bspw. @timestamp (Zeitpunkt
des Empfangs der Nachricht in Logstash).

Alle Felder bis auf "duration", enthalten statische Informationen die die 
Umgebung (host) oder ExpressJS selbst bereitstellt (request_method etc.). 

Die "duration" wird selbst berechnet - Dazu wird zunächst beim Start des 
Requests die Zeit aufgenommen und am Request-Objekt zwischen gespeichert.
Zu diesem Zweck wird eine einfache, sog. Middleware für ExpressJS definiert:
(eingesetzt in app.js)

```javascript
app.use(function(req, res, next) {
    req.hrstart = process.hrtime();
    next();
});
```

Dieser Teil wird nun bei jedem Request ausgeführt und holt die aktuelle Zeit
("high-resolution real time", siehe [process.hrtime](https://nodejs.org/api/process.html#process_process_hrtime_time)) 
und speichert sie am übergebenen Request-Object.

Sofern die Response gesendet (beendet) wird, kann nun die Dauer ermittelt werden:

```javascript
    var hrend, duration;
    hrend = process.hrtime(req.hrstart);
    duration = (hrend[0]*1000) + (hrend[1]/1000000);
```

Das Modul logstash.js startet die Verbindung und stellt eine "send"-Methode 
bereit, die ebenfalls als ExpressJS Middleware benutzt werden kann (da ihre 
Signatur die benötigten Variablen "Request", "Response" und "Next" enthält).

In dieser Methode wird die Nachricht zusammengebaut und versendet. Es wird
dazu auf das Event "finish" der "Response" gewartet (relevant für die Ermittlung
der Dauer "duration"):

```javascript
send: function(req, res, next) {
    res.on('finish', function() {
        var message = new Message(req, res);
        _send(message);
    });
    next();
}
```

Dann wird diese Middleware für die API-Routen in der [app.js](/app.js) bekannt 
gemacht:

```javascript
app.use('/api', [logstash.send, apiRoutes]); 
```

Die Middleware kann hier an erster Position (im Array) stehen, da sie sowieso 
auf das "finish" Event der "Response" wartet.

Jetzt wird bei jedem Request gegen die /api eine Nachricht an Logstash gesendet.

## 4. Schritt

Wir erzeugen Last auf den API-Endpunkten mit Vegeta, einem "load testing tool".

Damit die Antwortzeiten varieren, wird eine künstliche Aktivität in der API 
 simuliert: Ein simples .setTimeout warten eine zufällige Zahl an Millisekunden
 bis die Antwort gesendet wird. Ausserdem wird in etwa jeder 10. Antwort ein 
 Fehler simuliert, beim mit HTTP Statuscode 500 geantwortet wird.

```javascript
// API endpoints - requests goes here
router.get('/:endpoint', function(req, res, next) {
    setTimeout(function() { // simulate i/o (e.g. database) activity
        var statusCode;
        if (Math.random() <= 0.1) { // simulate an error every 10th request
            res.status(500).send({ error: 'Internal error' });
        } else {
            if (req.params.endpoint === 'question') {
                res.status(200).send({ question: question() });
            } else if (req.params.endpoint === 'answer') {
                res.status(200).send({ answer: answer() });
            } else if (req.params.endpoint === 'pick') {
                res.status(200).send(pick());
            } else {
                res.status(404).send({ error: 'Not found' });
            }
        }
        next();
    }, Math.floor(Math.random()*250));
});
```

Vegeta bekommt die Ziele, also die API-Endpunkte via [Konfiguration als Text-Datei](/docs/vegeta/targets.txt)
und wird mit einer vorgegebenen Dauer (Parameter "duration") und maximalen 
Anzahl Anfragen pro Sekunde (Parameter "rate") gestartet. Vegeta erzeugt beim 
 Ausführen einen Report, der durchgereicht und am Ende als Text angezeigt wird.

```
vegeta.exe attack -targets="docs\vegeta\targets.txt" -duration=300s -rate=1000 | tee results.bin | vegeta report
```

Sofern alle Dienste gestartet wurden, können die einlaufenden Requests in 
Kibana betrachtet und aufbereitet werden.