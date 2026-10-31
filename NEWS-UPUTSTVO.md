# Studentske novosti i Instagram

## Šta sada radi

- DDOS aktivnosti iz Sanity-ja su jedini izvor kalendara. Objavljivanje aktivnosti dodaje datum, Unpublish/Delete je uklanja pri sledećem osvežavanju. Kalendar se osvežava jednom u minutu dok je otvoren.
- Aktivnosti čiji je datum pre današnjeg datuma u Srbiji više nisu označene u kalendaru. Njihove objave ostaju u arhivi Aktivnosti.
- Prazne liste prikazuju da još nema objava za prikaz. Neuspešno osvežavanje ne prekriva postojeće objave porukom o grešci.
- CORS je odobren za javno čitanje sa `https://ddos.rs` i `http://192.168.1.64:4321`, bez credentials i bez prava pisanja. Ako se lokalna adresa promeni, novu tačnu adresu treba dozvoliti u Sanity API podešavanjima.
- ELFAK i SIP imaju zasebne horizontalne redove sa naslovima, datumima i linkovima ka originalnim člancima. Puni tuđi članci se ne kopiraju.
- Instagram koristi zvanični javni prikaz profila: nekoliko najnovijih objava, bez prikaza opisa objava. Nije potrebna prijava niti Meta token za ovaj režim. Prikaz zavisi od toga da Instagram profil ostane javan i dozvoljava ugrađivanje.

## Osvežavanje novosti

Ručno, iz direktorijuma sajta:

```powershell
npm.cmd run feeds:update
```

ELFAK se prvo čita preko zvaničnog RSS-a, a njegova HTML lista služi kao rezerva. SIP se čita sa javne naslovne strane. Ako izvor privremeno ne radi ili promeni strukturu, prethodna uspešna lista ostaje sačuvana.

Workflow `.github/workflows/news-feeds.yml` spreman je za tri pokretanja dnevno, na 8 sati. **Počeće da radi tek kada se izmene pošalju na podrazumevanu GitHub granu `master` i GitHub Actions bude omogućen.** U Actions se može pokrenuti i ručno preko Run workflow. GitHub može odložiti zakazana pokretanja.

Workflow upisuje javnu listu i opcione Instagram thumbnails u repozitorijum. Objavljeni sajt čita ažurnu listu sa javne GitHub adrese iz `news-config.json`, uz lokalnu rezervu. Zbog toga posle prvog objavljivanja ovih izmena nije potreban novi deploy celog sajta za svako osvežavanje Elfak/SIP vesti. GitHub CDN može kratko keširati listu.

Prvi deploy javnog sajta ipak je potreban: pokrenuti `npm.cmd run check` i postaviti generisani `dist/` na postojeći hosting.

## Instagram prikaz

Podrazumevano radi zvanični profil embed preko `www.instagram.com/embed.js`. On sam prikazuje najnovije javne objave. Na početnoj strani i u Novostima korisnik vidi malu galeriju sa profila; opisi objava se ne ispisuju kao tekst. Ako posetilac blokira Instagram skripte, ostaje link do profila.

Tačno jedna najnovija velika slika u potpuno prilagođenoj kartici zahteva Meta API povezivanje vlasnika naloga. Taj napredni režim je pripremljen kao opcija i nije uslov za javni Instagram prikaz koji sada radi.

Za napredni režim:

1. Vlasnik Business/Creator naloga povezuje svoj nalog kroz Meta Instagram API with Instagram Login, sa dozvolom za čitanje medija.
2. Dobijeni dugotrajni token se čuva privatno u GitHub Settings → Secrets and variables → Actions → `INSTAGRAM_ACCESS_TOKEN`. Token se ne šalje u chat, ne upisuje u `sanity-project.json`, niti u javni kod.
3. Opciono se postavlja Actions variable `INSTAGRAM_API_VERSION` (podrazumevano `v25.0`).
4. Ručno se pokrene news workflow. Posle uspešnog čitanja API-ja jedna najnovija slika dobija prednost na naslovnoj, a Instagram red dobija pojedinačne kartice.
5. Tokeni imaju rok važenja; obnavljanje se radi kroz Meta nalog. Kada API nije dostupan, ostaje prethodno preuzet sadržaj.

Za lokalno testiranje naprednog režima kopirati `.env.example` u `.env` i token uneti samo u taj lokalni fajl, koji je izuzet iz Git-a.

## Opcioni ručni izbor Instagram objave

U kodu Studio-a postoji odeljak **Instagram — odabrane objave**. Ako želiš da ga koristiš, ažuriraj već objavljeni Studio:

```powershell
npm.cmd run cms:deploy
```

U njemu možeš uneti link konkretne Instagram objave, datum i fotografiju. Caption se ne prikazuje na sajtu. Najnovija odabrana slika dobija prednost na naslovnoj, a workflow je može dodati u sačuvanu listu. Ako želiš da se vrati automatski profil embed, povuci odabrane objave i osveži listu.

## Provere

```powershell
npm.cmd run check
npm.cmd run cms:build
```

Testovi pokrivaju RSS/HTML parsiranje, izdvajanje SIP članaka, datume i uklanjanje prošlih aktivnosti, bezbedne linkove, Instagram odgovor bez caption-a i tokena u javnom rezultatu, kao i rezervnu news listu.

Izvori: [ELFAK](https://www.elfak.ni.ac.rs/informacije/novosti-i-obavestenja), [SIP](https://sip.elfak.ni.ac.rs/), [Instagram profil](https://www.instagram.com/ddos_elfak/), [GitHub schedule](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule).
