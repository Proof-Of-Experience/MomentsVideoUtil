var words = require("naughty-words");

export const ExplicitEnglishWords = () : string[] => {
  const filter = (obj : object) => [].concat(...Object.values(obj));

  return filter(words)
}
