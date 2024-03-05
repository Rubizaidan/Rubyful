# rubyful-jsの使い方

## 基本的な使い方

以下のコードをhtmlのhead部に追加してください。
これにより、ページ内で検出可能な漢字に自動でルビを振ります。

```html
<script src="https://YOUR-HOSTNAME/rubyful.js"></script>
```

## ルビを振りたい要素を指定する

下記のように、RubyfulJsAppオブジェクトを定義することで、refPathsに指定したXPathの要素のみにルビを振ることができます。
refPathsは配列で複数指定することができます。

```html
<script>
    window.RubyfulJsApp = {
        ]
        refPaths: [
            "//*[contains(@class,'content')]",
    };
</script>
<script src="https://YOUR-HOSTNAME/rubyful.js"></script>
```

## ルビのON/OFFボタンのスタイルを変更

rubyful-jsを読み込むと、ルビのON/OFFボタンが表示されます。
このボタンに対してスタイルを変更するには、`rubyfuljs-button is-customized` クラスに対してスタイルを指定してください。

```html
<style>
    button.rubyfuljs-button.is-customized {
        background-color: #000;
        color: #fff;
    }
</style>
```

## ルビ自体のスタイルを変更

自動で振られるルビについては、`<ruby>`タグ、及び`<rt>`タグには`rubyfuljs-insert`クラスが適用されていますので、
このクラスを直接指定することでスタイルを変更することができます。

```html
<style>
    ruby.rubyfuljs-insert {
        color: #f00;
    }

    rt.rubyfuljs-insert {
        color: #00f;
    }
</style>
```
