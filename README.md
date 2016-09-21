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


