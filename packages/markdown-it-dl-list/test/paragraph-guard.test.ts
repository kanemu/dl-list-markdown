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
test("dl starts when next line is blank (dt only)", () => {
    const md = `\
: This will be your definition list.

Still the same paragraph.
`;
    const html = `\
<dl>
  <dt>This will be your definition list.</dt>
</dl>
<p>Still the same paragraph.</p>
`;

    equalOutput(render(md), html);
});

test("dl starts when next line begins with indentation (dt continuation)", () => {
    const md = `\
: This will be your
  definition list.

Still the same paragraph.
`;

    const html = `\
<dl>
  <dt>This will be your
definition list.</dt>
</dl>
<p>Still the same paragraph.</p>
`;

    equalOutput(render(md), html);
});

test("NOT a dl when next line is non-blank and does not start with ':', space, or tab", () => {
    const md = `\
: this should NOT become a definition list
Still the same paragraph.
`;
    const html = `
<p>: this should NOT become a definition list
Still the same paragraph.</p>
`;

    equalOutput(render(md), html);
});

test('dl-list: stop reading when next line starts with normal text', () => {
    const md = `\
: term1
    : description1-1
    : description1-2
: term2
    : description2-1
    : description2-2
Still the same paragraph.
`;

    const html = `\
<dl>
  <dt>term1</dt>
  <dd>description1-1</dd>
  <dd>description1-2</dd>
  <dt>term2</dt>
  <dd>description2-1</dd>
  <dd>description2-2</dd>
</dl>
<p>Still the same paragraph.</p>
`;

    equalOutput(render(md), html);
})

test('parses block content inside definition descriptions', () => {
    const md = `\
: term
    : description paragraph
      
      - list item
      - list item
`;

    const html = `\
<dl>
    <dt>term</dt>
    <dd>
        <p>description paragraph</p>
        <ul>
            <li>list item</li>
            <li>list item</li>
        </ul>
    </dd>
</dl>
`;

    equalOutput(render(md), html);
})
