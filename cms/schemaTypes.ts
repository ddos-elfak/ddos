import { defineArrayMember, defineField, defineType } from 'sanity';

const imageFields = [
  defineField({ name: 'alt', title: 'Opis slike za čitače ekrana', type: 'string', description: 'Kratko opiši šta je na slici. Ako ostane prazno, koristi se naslov objave ili albuma.' }),
  defineField({ name: 'caption', title: 'Potpis ispod slike', type: 'string' }),
];
const dateField = () => defineField({ name: 'date', title: 'Datum', type: 'date', options: { dateFormat: 'DD.MM.YYYY.' }, validation: (R) => R.required() });
const titleField = () => defineField({ name: 'title', title: 'Naslov', type: 'string', validation: (R) => R.required().max(180) });
const slugField = () => defineField({ name: 'slug', title: 'Adresa objave', type: 'slug', description: 'Klikni Generate nakon unosa naslova. Adresa treba da ostane ista posle objavljivanja.', options: { source: 'title', maxLength: 96 }, validation: (R) => R.required() });
const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Belgrade', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());

const body = defineType({
  name: 'richBody', title: 'Sadržaj', type: 'array',
  of: [
    defineArrayMember({
      type: 'block', title: 'Tekst',
      styles: [{ title: 'Paragraf', value: 'normal' }, { title: 'Podnaslov', value: 'h2' }, { title: 'Manji podnaslov', value: 'h3' }, { title: 'Citat', value: 'blockquote' }],
      lists: [{ title: 'Lista', value: 'bullet' }, { title: 'Numerisana lista', value: 'number' }],
      marks: {
        decorators: [{ title: 'Podebljano', value: 'strong' }, { title: 'Kurziv', value: 'em' }, { title: 'Podvučeno', value: 'underline' }, { title: 'Precrtano', value: 'strike-through' }],
        annotations: [{ name: 'link', title: 'Link', type: 'object', fields: [defineField({ name: 'href', title: 'Adresa', type: 'url', validation: (R) => R.required().uri({ allowRelative: true, scheme: ['https', 'http', 'mailto', 'tel'] }) })] }],
      },
    }),
    defineArrayMember({ type: 'image', title: 'Slika', options: { hotspot: true }, fields: imageFields }),
    defineArrayMember({
      name: 'pollLink', title: 'Anketa preko linka', type: 'object',
      fields: [
        defineField({ name: 'title', title: 'Pitanje / naslov ankete', type: 'string', validation: (R) => R.required() }),
        defineField({ name: 'description', title: 'Objašnjenje', type: 'text', rows: 2 }),
        defineField({ name: 'url', title: 'Link ankete', type: 'url', description: 'Google Forms, StrawPoll ili drugi servis. Glasovi se čuvaju na tom servisu.', validation: (R) => R.required().uri({ scheme: ['https'] }) }),
        defineField({ name: 'buttonLabel', title: 'Tekst dugmeta', type: 'string', initialValue: 'Glasaj u anketi' }),
      ],
      preview: { select: { title: 'title' }, prepare: ({ title }) => ({ title, subtitle: 'Anketa — spoljni link' }) },
    }),
    defineArrayMember({ name: 'divider', title: 'Razdelna linija', type: 'object', fields: [defineField({ name: 'label', title: 'Oznaka (opciono)', type: 'string' })], preview: { prepare: () => ({ title: 'Razdelna linija' }) } }),
  ],
});

const news = defineType({
  name: 'news', title: 'Novost', type: 'document',
  initialValue: () => ({ date: today() }),
  fields: [titleField(), slugField(), dateField(),
    defineField({ name: 'summary', title: 'Kratak uvod', type: 'text', rows: 3, validation: (R) => R.required().max(600) }),
    defineField({ name: 'cover', title: 'Naslovna slika (opciono)', type: 'image', options: { hotspot: true }, fields: imageFields }),
    defineField({ name: 'body', title: 'Sadržaj objave', type: 'richBody', description: 'Tekst, podnaslovi, liste, slike, linkovi i ankete. Blokove možeš da prevlačiš i menjaš im redosled.' }),
  ],
  orderings: [{ title: 'Najnovije prvo', name: 'dateDesc', by: [{ field: 'date', direction: 'desc' }] }],
  preview: { select: { title: 'title', subtitle: 'date', media: 'cover' } },
});
const event = defineType({
  name: 'event', title: 'Događaj / aktivnost', type: 'document',
  fields: [titleField(), slugField(), dateField(),
    defineField({ name: 'time', title: 'Vreme u Srbiji (opciono)', type: 'string', description: 'Format 18:30. Datum i vreme se prikazuju u Aktivnostima i Kalendaru.', validation: (R) => R.regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/).error('Unesi vreme u formatu HH:mm, npr. 18:30.') }),
    defineField({ name: 'location', title: 'Lokacija', type: 'string', validation: (R) => R.required() }),
    defineField({ name: 'description', title: 'Kratak opis', type: 'text', rows: 3, validation: (R) => R.required() }),
    defineField({ name: 'cover', title: 'Naslovna slika / poster', type: 'image', options: { hotspot: true }, fields: imageFields }),
    defineField({ name: 'body', title: 'Dodatne informacije', type: 'richBody' }),
  ],
  orderings: [{ title: 'Po datumu', name: 'dateAsc', by: [{ field: 'date', direction: 'asc' }] }],
  preview: { select: { title: 'title', subtitle: 'date', media: 'cover' } },
});
const album = defineType({
  name: 'album', title: 'Album u galeriji', type: 'document',
  initialValue: () => ({ date: today() }),
  fields: [titleField(), slugField(), dateField(),
    defineField({ name: 'description', title: 'Opis albuma', type: 'text', rows: 3 }),
    defineField({ name: 'photos', title: 'Fotografije', type: 'array', description: 'Prevuci sve fotografije odjednom (npr. 15 slika). Prva je naslovna. Redosled menjaš prevlačenjem.', of: [defineArrayMember({ type: 'image', options: { hotspot: true }, fields: imageFields })], validation: (R) => R.required().min(1) }),
  ],
  orderings: [{ title: 'Najnoviji albumi prvo', name: 'dateDesc', by: [{ field: 'date', direction: 'desc' }] }],
  preview: { select: { title: 'title', subtitle: 'date', media: 'photos.0' } },
});
const instagramPost = defineType({
  name: 'instagramPost', title: 'Instagram — odabrane objave', type: 'document',
  description: 'Opcioni ručni prikaz dok Meta API nije povezan. Na sajtu se prikazuje slika i link, bez Instagram opisa.',
  initialValue: () => ({ date: today(), title: 'DDOS na Instagramu' }),
  fields: [titleField(), dateField(),
    defineField({ name: 'permalink', title: 'Link Instagram objave', type: 'url', description: 'Kopiraj link konkretne objave /p/ ili /reel/.', validation: (R) => R.required().custom((value) => /^https:\/\/(www\.)?instagram\.com\/(p|reel)\//.test(value || '') || 'Unesi link konkretne Instagram objave.') }),
    defineField({ name: 'image', title: 'Fotografija objave', type: 'image', options: { hotspot: true }, fields: imageFields, validation: (R) => R.required() }),
  ],
  orderings: [{ title: 'Najnovije prvo', name: 'dateDesc', by: [{ field: 'date', direction: 'desc' }] }],
  preview: { select: { title: 'title', subtitle: 'date', media: 'image' } },
});
export const schemaTypes = [body, news, event, album, instagramPost];
