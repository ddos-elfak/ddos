# DDOS — uputstvo za online editor

## Jednokratno uključivanje

Projekat je sada povezan, a Studio je objavljen na https://ddos-editor.sanity.studio/. Koraci ispod služe za ponovno postavljanje. Domen ddos.rs i postojeći hosting ostaju isti.

1. Otvori [Sanity Manage](https://www.sanity.io/manage), prijavi se svojim nalogom i napravi projekat za DDOS.
2. Napravi dataset `production` sa public pristupom za čitanje objavljenog sadržaja.
3. U Members ostavi samo svoj nalog. Javni pristup čitanju ne dozvoljava posetiocima uređivanje. Administratorski pristup određuju Sanity prijava i članstvo u projektu.
4. Kopiraj Project ID iz podešavanja projekta. To je javni identifikator, nije lozinka.
5. U direktorijumu sajta pokreni:

```sh
npm ci --prefix cms
npm run cms:setup
```

Unesi project ID i naziv dataseta. Ova komanda menja samo `sanity-project.json`, koji koriste i sajt i editor. API token nije potreban javnom sajtu.

6. Prijavi CLI na svoj Sanity nalog, pa objavi editor. U PowerShell-u koristi `npm.cmd`:

```sh
npm.cmd run cms:login
npm.cmd run cms:deploy
```

Komanda za prijavu vodi te kroz izbor načina prijave i otvara browser. Završi prijavu svojim Sanity nalogom, zatim pokreni deploy i izaberi dostupno ime za Studio. Sačuvaj dobijenu `https://izabrano-ime.sanity.studio` adresu kao privatni bookmark. Ako projekat još nije povezan, deploy se namerno zaustavlja. Globalna komanda `sanity` nije potrebna: npm skripte koriste instalaciju iz `cms/node_modules`.

7. U Sanity Manage → API → CORS origins dozvoli tačne adrese:
   - `https://ddos.rs` i, ako se koristi, `https://www.ddos.rs`: bez credentials, za javno čitanje.
   - Dobijenu Studio adresu: sa credentials, za prijavu i uređivanje.
   - Za lokalni razvoj po potrebi `http://localhost:4321` i `http://localhost:3333`; credentials samo za Studio.
8. Pokreni `npm run check` i jednom postavi generisani `dist/` na hosting ddos.rs.
9. Proveri objavljivanje jedne probne novosti, njeno pojavljivanje na sajtu, povlačenje objave i pristup editoru iz privatnog prozora bez prijave. Ova provera se radi tek kada postoji stvarni Sanity projekat.

Posle povezivanja uređuješ preko Studio adrese sa računara ili telefona. Za novu objavu nisu potrebni kod i deploy.

## Šta posetioci vide

Na ddos.rs nema admin linka, /admin stranice ni Studio aplikacije. Editor se hostuje odvojeno. Poznavanje Studio adrese nije dozvola za pristup: Sanity proverava nalog i članstvo. Sama login adresa nije tajna i nije sigurnosna zaštita. Studio statički fajlovi mogu biti javno dostupni; pravo pisanja zahteva prijavu.

Javni sajt koristi isključivo GET upite za objavljene dokumente, bez write tokena i bez kolačića za CMS. Draft i release verzije se ne prikazuju. Slike su javni sadržaj na Sanity CDN-u; ne koristi ovaj projekat kao skladište poverljivih fajlova.

## Novost

1. U Studio izaberi **Novosti** → novi dokument.
2. Unesi naslov, klikni **Generate** za adresu objave, izaberi datum i napiši kratak uvod.
3. Po želji dodaj naslovnu sliku.
4. U **Sadržaj objave** piši tekst i dodaj blokove:
   - paragraf, podnaslov, manji podnaslov i citat;
   - podebljan, kurziv, podvučen ili precrtan tekst;
   - numerisane i obične liste;
   - link označenog teksta;
   - slike sa opisom i potpisom;
   - anketu preko linka;
   - razdelnu liniju.
5. Redosled blokova menja se prevlačenjem. Klikni **Publish** kada želiš da objava bude javna.

Nacrt se automatski čuva u Studio-u, ali se ne prikazuje na sajtu. Datum je datum prikaza i sortiranja, a ne automatski zakazano objavljivanje. Objave su javne tek posle Publish. Za povlačenje koristi Unpublish; za izmenu postojeću objavu uredi i ponovo objavi. Ne menjaj već objavljenu adresu bez potrebe, da sačuvani linkovi nastave da rade.

## Događaj / aktivnost

Izaberi **Događaji i aktivnosti**, unesi naslov, adresu, datum, vreme (npr. 18:30), lokaciju i opis. Možeš dodati poster i dodatne informacije pomoću istog blok editora.

Posle Publish ista stavka se pojavljuje:
- kao objava na stranici **Aktivnosti**;
- kao obeležen datum i opis u **Kalendaru**.

Vreme i današnji datum računaju se za Srbiju. Kalendar prikazuje samo današnje i buduće aktivnosti. Kada datum prođe, oznaka se uklanja iz kalendara, a sama objava ostaje u Aktivnostima. Unpublish/Delete uklanja aktivnost i iz kalendara pri sledećem osvežavanju. Otvoren kalendar proverava aktivnosti jednom u minutu.

## Album, npr. Game Day 2026

1. Izaberi **Albumi u galeriji** → novi dokument.
2. Unesi **Game Day 2026**, generiši adresu i izaberi datum.
3. U **Fotografije** prevuci svih 15 slika odjednom.
4. Prva fotografija je naslovna. Prevlačenjem menjaš redosled.
5. Po želji unesi opise za čitače ekrana i potpise ispod pojedinih slika. Ako opis nije unet, sajt koristi naslov albuma i redni broj fotografije.
6. Klikni **Publish**.

Na sajtu se pojavljuje jedan album sa naslovom, datumom, opisom i brojem fotografija. Klik na naslovnu sliku ili „Otvori album” otvara njegove fotografije. Klik na fotografiju je uvećava; strelice u prikazu ili na tastaturi listaju samo taj album. Escape i × zatvaraju prikaz.

Za sledeći događaj napravi novi album. Ne dodaj nepovezane događaje u isti album.

## Ankete

Napravi anketu u servisu koji koristiš, na primer Google Forms ili StrawPoll. U objavi ubaci blok **Anketa preko linka**, unesi naslov, objašnjenje, HTTPS link i tekst dugmeta. Posetioci glasaju u novoj kartici na tom servisu, gde se čuvaju i rezultati. Sajt ne pravi svoju bazu glasova.

## Arhiva i slike

Liste novosti i aktivnosti imaju „Prikaži još”; albumi se učitavaju po grupama. Starije objave ne moraju da se brišu početkom nove godine. „Link do objave” daje direktan link i za stariju stavku.

Slike se učitavaju po potrebi i isporučuju preko Sanity CDN-a u optimizovanoj veličini. Kadriranje iz editora se primenjuje pri prikazu slike. Za veliki broj albuma prati kvote prostora i protoka u svom Sanity nalogu; uslovi i cene servisa mogu se menjati.

## Backup i prenos na novi računar

Kod čuvaj u svom Git repozitorijumu. CMS sadržaj i slike čuvaju se odvojeno u tvom Sanity projektu. Za rezervnu kopiju koristi zvanični izvoz:

```sh
cd cms
npx sanity dataset export production ../backups/ddos-backup.tar.gz
```

Pre izvoza napravi direktorijum `backups/`. On je izuzet iz Git-a. Sačuvaj kopiju i na drugom svom uređaju. Ponovni izvoz u isti fajl može ga zameniti, pa za svaku kopiju koristi novo ime sa datumom.

Na novom računaru za razvoj:

```sh
npm ci
npm ci --prefix cms
npm run check
```

Za svakodnevno dodavanje sadržaja na novom uređaju samo otvori Studio adresu i prijavi se svojim nalogom.

## Tehnička ograničenja provere

Kod, javni build, modeli i Studio build mogu se proveriti bez naloga. Stvarni upload, login, pravo pristupa i objavljivanje uživo nisu provereni dok se ne kreira i poveže tvoj projekat.

Javni sajt učitava aktuelni sadržaj JavaScript-om. Bez JavaScripta prikazuje početni sadržaj sa poslednjeg builda; za nov sadržaj u početnom HTML-u i ažuran SEO može se podesiti CMS webhook za build na postojećem hostingu.

Izvori: [Studio pristup i deployment](https://www.sanity.io/docs/studio/deployment), [Više slika u jednom uploadu](https://www.sanity.io/docs/studio/image-type), [Image CDN i transformacije](https://www.sanity.io/docs/apis-and-sdks/image-urls).
