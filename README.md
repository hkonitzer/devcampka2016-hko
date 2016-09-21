# devcampka2016-hko


Session "Performance Monitoring von NodeJS Web-Apps mit dem ELK Stack"
im [DevCamp Karlsruhe 2016](http://www.campus-devcamp.de/devcamp-karlsruhe-23-24-09-2016/)

## Worum geht es?

Die Session will zeigen, wie man eine in NodeJS implementierte Web-App/
-Server mit einfachen Mitteln via dem Elastic Stack montioren kann. 
Dabei geht es zunächst, um die Aufzeichnung der Antwortzeiten sowie der 
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

Auf der HTML Seite (index.ejs) können alle drei API Requests getestet 
werden.

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
 
Die Konfiguration liegt auch hier [pipeline.conf](/docs/logstash/pipeline.conf)
 
Nun kann auch Logstash gestartet werden.

### Implementation in die ExpressJS Welt

