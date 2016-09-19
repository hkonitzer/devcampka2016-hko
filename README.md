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

