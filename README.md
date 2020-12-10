# Web Caching Demo

Mehrere Akteure in einen Docker-Netzwerk 
als vereinfachtes Modell für Clients, Servers & Caches im echten Internet.
TL;DR: `docker-compose up` und dann auf http://localhost:8080 einmal den Ablauf eines Requests betrachten. 

## Grundlagen
Diese Demo zeigt, wie ein Cache einem Server arbeit abnimmt, 
in dem der Cache die Resourcen des Servers zwischen speichert.
Der Cache ist dabei der Haupt-Ansprechpartner für die Clients,
welche den Server selbst nicht kennen.
Fragt ein Client eine Resource des Servers an, so händelt der Cache diesen Request.
Hat er die Resource gespeichert, so überprüft er, ob die Resource noch gilt.
Für diese Demo wurde ein - sehr - einfacher Ansatz gewählt, bei der der Cache selber entscheidet,
dass eine Resource für einen gegebenen Zeitraum gilt.
Ist die Resource im Cache und ist sie noch gültig, dann kann der Cache die Anfrage selbst beantworten.
Der Client erhält die Resource vom Cache.
Ist die Resource nicht im Cache (oder im Cache, aber abgelaufen), muss der Cache den Server nach der aktuellen Version fragen.
Er merkt sich diese (schreibt sie also in den Cache) und leitet die Anfrage weiter an den Client.
Der Client erhält die angefragte resource und bekommt von der Kommunikation zwischen Cache und Server und möglichen Cache misses nichts mit.

## Erklärung Docker + Server
Wir haben in diesem Projekt mehrere Akteure. 
Drei Akteure leisten dabei die eigentliche Arbeit der Demo, nähmlich

- Client
- Cache
- Server

Der Client möchte eine Resource, wie evtl. _test.html_ vom Server haben, 
und als Server kennt er den Cache bzw. der Cache ist zwischen ihm und den Server.
Der Cache leitet gecachtes zurück oder an den Server weiter, 
welcher die Resource _test.html_ besitzt. 
Alle drei schreiben hierbei logs in ein logfile, 
welches durch die Magie von Docker (oder waren es File-mounts für Volumes?) zwischen allen dreien geteilt wird.
Um auch etwas von dem Ablauf des Requests mitzubekommen wird dieses File in von dem letzten Akteur beobachtet:

- Visualizer

Dieser erlaubt über eine Webseite, den Request beim Client anzustoßen und zeigt,
wie die anderen Aktuere in das gemeinsame logfile schreiben.

Alle Akteure sind hierbei in Node mal eben hingescriptete Server.
Dies ist eventuell beim Client etwas seltsam (warum sollte der Client ein Server sein...),
aber nun einmal notwendig, damit alle ggf. über http miteinander kommunizieren können 
und z.B. der Visualizer dem Client sagen kann, er solle doch bitte jetzt die Resource _test.html_ anfordern.

In der _docker-compose.yaml_ kann man noch ein paar Einstellungen vornehmen, z.B. für wie lange Resourcen gecacht werden können.

## Offene Punkte
Evtl. kann man noch Client-Caching einbinden, oder eine Funktion, die den (Server-)Cache mal eben leert, 
damit man nicht warten muss, dass die Resource abläuft. 




