// The personal "who built this" story on the About page. Kept as data,
// separate from the page's layout, so it's obvious where to fill in real
// details — never invent a name, date, or number here; leave the
// placeholder in place until there's a real one to put in its place.
export interface CreatorStory {
  name: string
  role: string
  paragraphs: string[]
}

export const creatorStory: CreatorStory = {
  name: '[Your name]',
  role: '[Your role or background — e.g. student, developer]',
  paragraphs: [
    '[Replace this paragraph with the real story: why you built Anywhere Path, what problem you were personally trying to solve, and what prompted the first version of it.]',
    '[Optional second paragraph — what you learned building it, or what you\'re doing next.]',
  ],
}
