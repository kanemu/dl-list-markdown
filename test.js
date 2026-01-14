import MarkdownIt from "markdown-it";
import dlList from "markdown-it-dl-list";

const md = new MarkdownIt();
md.use(dlList);

const src = `\
: fruits
    :: apple
        : Orin
        : Fuji
        : Jonagold
    : grape
    : orange
`;

console.log(md.render(src));