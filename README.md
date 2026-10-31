# DDOS — Elektronski fakultet

Javni Astro sajt i zaseban Sanity Studio za uređivanje sadržaja. Paleta, logo, font i postojeći izgled sajta su zadržani.

## Pokretanje i provere

Potreban je Node.js 22.23.4+ (preporučeno Node 24) i npm.

```sh
npm ci
npm run dev
npm run check
```

`check` pokreće testove kalendara, CMS upita, prikaza i bezbednog rukovanja sadržajem, zatim produkcioni build i proveru linkova, slika, metapodataka i odsustva admin ruta iz javnog builda.

## Uređivanje sadržaja

Novosti sa fakulteta/SIP-a, automatsko osvežavanje i zvanični Instagram prikaz: [NEWS-UPUTSTVO.md](NEWS-UPUTSTVO.md).

Detaljno uputstvo: [CMS-UPUTSTVO.md](CMS-UPUTSTVO.md).

- **Novosti:** naslov, datum, uvod, naslovna slika i blok editor sa paragrafima, podnaslovima, formatiranjem, listama, slikama, linkovima i spoljnim anketama.
- **Događaji:** naslov, datum, vreme, lokacija, opis, poster i dodatni sadržaj. Jedna objava se prikazuje u Aktivnostima i Kalendaru.
- **Albumi:** naslov, datum, opis i više fotografija. Svaki događaj dobija zaseban album sa uvećanjem i listanjem fotografija.
- Nacrti ostaju u CMS-u; javni sajt čita samo objavljene dokumente.
- Studio se objavljuje na posebnoj adresi i nije deo javnog `dist/` direktorijuma. Javni sajt nema admin panel niti mogućnost pisanja.

Sanity projekat je povezan kroz `sanity-project.json`. Lozinke i write tokeni ne stavljaju se u sajt. CORS za ddos.rs i lokalni pregled dozvoljava samo javno čitanje.

## Povezivanje (jednom)

```sh
npm ci --prefix cms
npm run cms:setup
npm run cms:login
npm run cms:deploy
```

Zatim podesiti CORS prema uputstvu i jednom ponovo objaviti javni sajt. Posle toga se objave učitavaju iz Sanity-ja pri poseti stranici, bez novog deploya za svaku objavu. Osvežavanje stranice prikazuje ažuriran sadržaj; CDN može imati kratko kašnjenje.

## Deploy javnog sajta

```sh
npm run check
```

Na postojeći hosting postavlja se **samo sadržaj `dist/`**. Potreban je statički hosting u korenu domena koji služi `/ruta/index.html` za `/ruta` i `404.html` uz status 404. Nisu potrebni baza, serverski adapter niti promena domena. Priloženi Netlify config je opcioni; Sanity povezivanje radi i na drugom statičkom hostingu.

Podesiti build promenljivu `SITE_URL=https://ddos.rs` radi canonical i Open Graph URL metapodataka.

Build sadrži početni snimak CMS sadržaja radi prikaza bez JavaScripta i indeksiranja. JavaScript učitava aktuelne objave i dodatne stranice liste. Ako je važno da najnovije objave odmah budu i u početnom HTML-u za pretraživače, podesiti CMS webhook za novi build na svom hostingu.

## Održavanje

```sh
npm audit
npm audit --prefix cms
npm run cms:build
```

Astro je nadograđen na 7.4.4 zbog poznatih bezbednosnih propusta prethodne verzije. Provera zavisnosti javnog sajta nakon nadogradnje prijavljuje 0 ranjivosti. Sanity 6.21.0 trenutno ima tranzitivna audit upozorenja u CLI alatima (js-yaml, minimatch, smol-toml, undici); oni se ne isporučuju kao admin panel ili server javnog sajta. Ne primenjivati automatski `audit fix --force`, koji predlaže downgrade Sanity-ja. Ažuriranja editora proveravati odvojeno i ponoviti CMS build.

Sadržaj se dugoročno čuva u tvom Sanity projektu; izvoz/backup je opisan u CMS uputstvu. Troškovi i kvote hostinga/CMS-a zavise od izabranog naloga i potrošnje.

## Glavni fajlovi

- `sanity-project.json` — javni project ID, dataset i fiksirana API verzija, bez tajni
- `cms/` — zaseban editor i modeli sadržaja
- `src/lib/cms.mjs` — čitanje objavljenog sadržaja, paginacija i upiti po datumima
- `src/lib/render-content.mjs` — bezbedan prikaz blokova, albuma, linkova i slika
- `src/components/ContentFeed.astro` — prikaz liste i učitavanje još objava
- `src/components/GalleryLightbox.astro` — uvećanje i listanje slika po albumu
- `src/scripts/calendar.ts` — aktuelni događaji i današnji datum po vremenu Srbije
- `src/data/content.ts` — opciona lokalna rezerva sadržaja; svakodnevno uređivanje radi se u CMS-u
- `src/config/site.ts` — naziv organizacije, navigacija i društvene mreže
