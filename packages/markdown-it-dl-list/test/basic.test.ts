import { test, expect } from "vitest";
import MarkdownIt from "markdown-it";
import dlList from "../src/index";

function render(md: string) {
    return new MarkdownIt().use(dlList).render(md).trim();
}

function equalOutput(result: string, expected: string) {
    const trimHtml = (html: string): string => {
        return html.replace(/^\s*\</, '<')
            .replace(/\>\s*\</g, '><')
            .replace(/\>\s*$/, '>')
    }
    expect(trimHtml(result)).toBe(trimHtml(expected))
}

//---
test('dl-list: basic dt + dd', () => {
    const md = `\
: term
    : desc
`;
    const html = `\
<dl>
    <dt>term</dt>
    <dd>desc</dd>
</dl>
`;
    equalOutput(render(md), html)
})

test('dl-list: multiple dd for one term', () => {
    const md = `\
: term
    : desc1
    : desc2
`;
    const html = `\
<dl>
    <dt>term</dt>
    <dd>desc1</dd>
    <dd>desc2</dd>
</dl>
`;
    equalOutput(render(md), html)
})

test('dl-list: consecutive dt before a dd', () => {
    const md = `\
: term1
: term2
    : desc
`;
    const html = `\
<dl>
    <dt>term1</dt>
    <dt>term2</dt>
    <dd>desc</dd>
</dl>
`;
    equalOutput(render(md), html)
})

test('dl-list: dd indented with a tab (tab == ddIndent)', () => {
    const md = `\
: term1
\t: desc
`;
    const html = `\
<dl>
    <dt>term1</dt>
    <dd>desc</dd>
</dl>
`;
    equalOutput(render(md), html)
})

test('dl-list: multiple items (dt resets item)', () => {
    const md = `\
: term1
    : desc1
: term2
    : desc2
`;
    const html = `\
<dl>
    <dt>term1</dt>
    <dd>desc1</dd>
    <dt>term2</dt>
    <dd>desc2</dd>
</dl>
`;
    equalOutput(render(md), html)
})

test('dl-list: dt continuation line (indented, non-colon)', () => {
    const md = `\
: term line 1
  term line 2
    : desc
`;
    const html = `\
<dl>
    <dt>term line 1
term line 2</dt>
    <dd>desc</dd>
</dl>
`;
    // NOTE: continuation uses a literal newline (dlHardBreak) inside <dt>.
    equalOutput(render(md), html)
})

test('dl-list: dd marker with no content uses container (no dlDescText)', () => {
    const md = `\
: term
    :
    desc
`;
    const html = `\
<dl>
    <dt>term</dt>
    <dd>desc</dd>
</dl>
`;
    equalOutput(render(md), html)
})

test('dl-list: dd markers only, no text', () => {
    const md = `\
: term
    :
`;
    const html = `\
<dl>
    <dt>term</dt>
    <dd></dd>
</dl>
`;
    equalOutput(render(md), html)
})

test('dl-list: dd container captures indented continuation lines', () => {
    const md = `\
: term
    : first line
    second line
`;
    const html = `\
<dl>
    <dt>term</dt>
    <dd>first line
second line</dd>
</dl>
`;
    // dd content is re-parsed; a single <p> is unwrapped, preserving the newline.
    equalOutput(render(md), html)
})

test('dl-list: dd container stops before next term', () => {
    const md = `\
: term1
    : desc1
: term2
    : desc2
`;
    const html = `\
<dl>
    <dt>term1</dt>
    <dd>desc1</dd>
    <dt>term2</dt>
    <dd>desc2</dd>
</dl>
`;
    equalOutput(render(md), html)
})

test('dl-list: dd can nest dl (": : apple" etc)', () => {
    const md = `\
: fruits
    : : apple
          : Orin
          : Fuji
          : Jonagold
    : grape
    : orange
`;
    const html = `\
<dl>
  <dt>fruits</dt>
  <dd>
    <dl>
      <dt>apple</dt>
      <dd>Orin</dd>
      <dd>Fuji</dd>
      <dd>Jonagold</dd>
    </dl>
  </dd>
  <dd>grape</dd>
  <dd>orange</dd>
</dl>
`;

    equalOutput(render(md), html);
})

test('dl-list: dd can nest dl (":: apple" etc)', () => {
    const md = `\
: fruits
    :: apple
         : Orin
         : Fuji
         : Jonagold
    : grape
    : orange
`;
    const html = `\
<dl>
  <dt>fruits</dt>
  <dd>
    <dl>
      <dt>apple</dt>
      <dd>Orin</dd>
      <dd>Fuji</dd>
      <dd>Jonagold</dd>
    </dl>
  </dd>
  <dd>grape</dd>
  <dd>orange</dd>
</dl>
`;

    equalOutput(render(md), html);
})

test('dl-list: dd can nest dl (more complex structure)', () => {
    const md = `\
: Apple
    : : Orin
          : The name comes from “king of apples”
      : Fuji
          : The apple variety that originated in Japan
            and is the most produced around the world.
      : Jonagold
          : A popular variety created in America
            by crossing Golden Delicious and Jonathan.
    : There are many other varieties as well.
: Grapes
    : purple, clustered fruit
: Melon
    : covered in a green, hard skin
`;
    const html = `\
<dl>
    <dt>Apple</dt>
    <dd>
        <dl>
            <dt>Orin</dt>
            <dd>The name comes from “king of apples”</dd>
            <dt>Fuji</dt>
            <dd>The apple variety that originated in Japan
and is the most produced around the world.</dd>
            <dt>Jonagold</dt>
            <dd>A popular variety created in America
by crossing Golden Delicious and Jonathan.</dd>
        </dl>
    </dd>
    <dd>There are many other varieties as well.</dd>
    <dt>Grapes</dt>
    <dd>purple, clustered fruit</dd>
    <dt>Melon</dt>
    <dd>covered in a green, hard skin</dd>
</dl>
`;

    equalOutput(render(md), html);
})

test('dl-list: blank line ends dl-list; following paragraph remains', () => {
    const md = `\
: term
    : desc

After paragraph.
`;
    const html = `\
<dl>
    <dt>term</dt>
    <dd>desc</dd>
</dl>
<p>After paragraph.</p>
`;
    equalOutput(render(md), html)
})

test('dl-list: does not start when ":" is indented 4+ columns', () => {
    const md = `\
    : not a dl
`;
    const html = `\
<pre><code>: not a dl
</code></pre>
`;
    // micromark will treat this as a code block (4 leading spaces).
    equalOutput(render(md), html)
})

test("dl-list: in blockquate", () => {
    const md = `\
> : term1
>     : description1
> : term2
>     : description2
`;
    const html = `\
<blockquote>
    <dl>
        <dt>term1</dt>
        <dd>description1</dd>
        <dt>term2</dt>
        <dd>description2</dd>
    </dl>
</blockquote>
`;

    equalOutput(render(md), html);
})

test("dl-list: with headings, paragraphs, and blockquotes", () => {
    const md = `\
# title

paragraph1
paragraph2

: term1
    : description1-1
      description1-2
: term2
    : description2-1
    : description2-2

> ## blockquates
> 
> : term1
>     : : inner term
>           : inner desc1
>           : inner desc2
> : term2
>     : description2-1
>     : description2-2

after paragraph
`;
    const html = `\
<h1>title</h1>
<p>paragraph1
paragraph2</p>
<dl>
    <dt>term1</dt>
    <dd>description1-1
description1-2</dd>
    <dt>term2</dt>
    <dd>description2-1</dd>
    <dd>description2-2</dd>
</dl>
<blockquote>
    <h2>blockquates</h2>
    <dl>
        <dt>term1</dt>
        <dd>
            <dl>
                <dt>inner term</dt>
                <dd>inner desc1</dd>
                <dd>inner desc2</dd>
            </dl>
        </dd>
        <dt>term2</dt>
        <dd>description2-1</dd>
        <dd>description2-2</dd>
    </dl>
</blockquote>
<p>after paragraph</p>
`;

    equalOutput(render(md), html);
})