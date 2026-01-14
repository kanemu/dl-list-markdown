# CommonMark + DL-List サンプル

## 1. テキスト装飾
*斜体* または _斜体_  
**太字** または __太字__  
***太字かつ斜体***

## 2. リスト
* 箇条書き
    * ネスト（半角スペース4つ）
* 項目

1. 番号付き
2. 項目

## 定義リスト

: [りんご](https://ja.wikipedia.org/wiki/%E3%83%AA%E3%83%B3%E3%82%B4)
    : 赤くてまるい *果物*
: [ぶどう](https://ja.wikipedia.org/wiki/%E3%83%96%E3%83%89%E3%82%A6)
    : 紫で房状の **果物**
: [めろん](https://ja.wikipedia.org/wiki/%E3%83%A1%E3%83%AD%E3%83%B3)
    : 緑で固い皮に包まれている

## 3. リンクと画像
[CommonMark 公式](https://commonmark.org)  
![Logo](https://commonmark.org/help/images/favicon.png)

## 4. 引用
> 引用文です。
>> ネストした引用です。

## 5. コード
インラインで `code` を書く。

ブロックでの記述：
```javascript
const message = "Hello World";
console.log(message);
```

## 6. 水平線
---

## 7. エスケープ
\\* アスタリスクをそのまま表示する。
