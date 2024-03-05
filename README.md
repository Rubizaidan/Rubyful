# 【開発者向け】プロジェクトの使い方

## ルビフルボタンをローカルで試す

以下のようにコマンドを実行することで、開発用のルビフルボタンをビルドした上でサーバーを起動できます。

```bash
npm install
npm run build-dev
npm run start
```
サーバーを起動したあとに[http://localhost:5500/example-on-local.html](http://localhost:5500/example-on-local.html) を開くと、ローカルでルビフルボタンを試すことができます。

## リリース用にルビフルボタンをビルドする

`.env` に本番環境で使う各種URL等を記述した上で、以下のコマンドを実行すると `dist` ディレクトリにリリース用のルビフルボタンがビルドされます。
作成されたファイル一式をホスティングする等してお使いください。

```bash
npm run build
```


# 【利用者向け】ルビフルボタンの使い方

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
