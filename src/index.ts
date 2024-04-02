// kuromojiライブラリのインポート
import * as kuromoji from 'kuromoji';
import './style.css';

declare global {
  interface Window {
    RubyfulJsApp?: {
      refPaths?: string[];
    };
  }
}

const containsKanji = (text: string): boolean => {
  const kanji = /[\p{Script=Han}]/u;
  return kanji.test(text);
}

const transformKatakana = (input: string) => {
  if (!input) return input;
  // ひらがなをカタカナに変換
  return input.replace(/[\u3041-\u3096]/g, function (match) {
    const chr = match.charCodeAt(0) + 0x60;
    return String.fromCharCode(chr);
  });
};

const splitKanjiAndOther = (input: string): string[] => {
  return input.split(/(\p{Script=Han}+)/gu).filter(Boolean);
}
const transformHiragana = (text: string): string => {
  if (!text) return text;
  return text.replace(/[\u30A1-\u30F6]/g, function (match) {
    var chr = match.charCodeAt(0) - 0x60;
    return String.fromCharCode(chr);
  });
}
const generateRubyHTML = (surface_form: string, reading: string, isRubyOn: string): string => {

  const surface_form_array_raw = splitKanjiAndOther(surface_form)
  if (surface_form_array_raw.length === 1) {
    return `<ruby class="rubyfuljs-insert">${surface_form_array_raw[0]}<rt class="rubyfuljs-insert ${isRubyOn === 'true' ? 'is-shown' : ''}">${transformHiragana(reading)}</rt></ruby>`;
  }

  const surface_form_array_match = surface_form_array_raw.map((str) => {
    return str.match(/[\p{Script=Hiragana}\p{Script=Katakana}]/gu) ? transformKatakana(str) : str;
  });
  const regex_match = new RegExp(`^${surface_form_array_match.map((str) => str.match(/[\p{Script=Hiragana}\p{Script=Katakana}]/gu) ? `(${str})` : "(.+)").join('')}$`, 'gu');
  const regex_match_copy = new RegExp(`^${surface_form_array_match.map((str) => str.match(/[\p{Script=Hiragana}\p{Script=Katakana}]/gu) ? `(${str})` : "(.+)").join('')}$`, 'gu');
  const surface_form_katakana = surface_form_array_match.join('');
  const surface_match_result = regex_match.exec(surface_form_katakana);
  const surface_array_raw = surface_match_result ? surface_match_result.slice(1) : [];
  const reading_match_result = regex_match_copy.exec(reading)
  const reading_array = reading_match_result ? reading_match_result.slice(1) : [];

  let rubyHTML = '';
  for (let i = 0; i < surface_array_raw.length; i++) {
    if (surface_array_raw[i].match(/[\p{Script=Hiragana}\p{Script=Katakana}]/gu)) {
      rubyHTML += surface_form_array_raw[i];
    } else {
      rubyHTML += `<ruby class="rubyfuljs-insert">${surface_form_array_raw[i]}<rt class="rubyfuljs-insert ${isRubyOn === 'true' ? 'is-shown' : ''}">${transformHiragana(reading_array[i])}</rt></ruby>`;
    }
  }

  return rubyHTML;
};

let tokenizerPromise: Promise<kuromoji.Tokenizer<kuromoji.IpadicFeatures>> | null = null;

const getTokenizer = (): Promise<kuromoji.Tokenizer<kuromoji.IpadicFeatures>> => {
  if (!tokenizerPromise) {
    const DictPath = `${process.env.HOSTING_URL}/dict`;
    tokenizerPromise = new Promise((resolve, reject) => {
      kuromoji.builder({ dicPath: DictPath }).build((err, tokenizer) => {
        if (err) {
          reject(err);
        } else {
          resolve(tokenizer);
        }
      });
    });
  }
  return tokenizerPromise;
};

const processHtmlWithKuromoji = async (htmlText: string, isRubyOn: string): Promise<string> => {
  const tokenizer = await getTokenizer();

  // HTMLをタグとテキストに分ける
  const htmlParts = htmlText.split(/(<ruby.*?<\/ruby>|<.*?>)/);
  const processedPartsPromises = htmlParts.map((part, index, htmlParts) => {
    let prevPartIsStyleOrScriptTag = false;
    if(index > 0){
      prevPartIsStyleOrScriptTag = htmlParts[index - 1].startsWith('<style') || htmlParts[index - 1].startsWith('<script');
    } 
    // タグでない、かつ漢字を含む部分を形態素解析
    if (!part.startsWith('<') && !prevPartIsStyleOrScriptTag) {
      const path = tokenizer.tokenize(part);
      // 形態素解析した結果からルビ用のHTMLを生成
      return path.map((token: any) => {
        // 漢字が含まれており読みがある場合にルビを生成
        if (token.reading && containsKanji(token.surface_form)) {
          return generateRubyHTML(token.surface_form, token.reading, isRubyOn);
        } else {
          return token.surface_form;
        }
      }).join('');
    } else {
      // タグの部分はそのまま返す
      return Promise.resolve(part);
    }
  });

  // 全ての部分の処理が終わったら結合してHTMLを生成
  const processedParts = await Promise.all(processedPartsPromises);
  return processedParts.join('');
};

const processPlainTextWithKuromoji = async (plainText: string, isRubyOn: string): Promise<string> => {
  const tokenizer = await getTokenizer();
  const path = tokenizer.tokenize(plainText);
  return path.map((token: any) => {
    if (token.reading && containsKanji(token.surface_form)) {
      return generateRubyHTML(token.surface_form, token.reading, isRubyOn);
    } else {
      return token.surface_form;
    }
  }).join('');
}

const addRubyTextRecursively = async (node: Node, isRubyOn: string) => {
  for (let i = 0; i < node.childNodes.length; i++) {
    if (node.childNodes[i].nodeType === Node.TEXT_NODE) {
      let textContent = node.childNodes[i].textContent;
      if (textContent) {
        let htmlString = await processPlainTextWithKuromoji(textContent, isRubyOn);
        console.log('htmlString', htmlString)
        let newNode = document.createElement('span');
        newNode.innerHTML = htmlString;
        console.log('newNode', newNode); // この処理を行っても、console.logで出力されるnewNodeは空のspanタグになってしまいます。
        if (newNode.firstChild) {
          node.replaceChild(newNode.firstChild, node.childNodes[i]);
        }
      }
    } else {
      addRubyTextRecursively(node.childNodes[i], isRubyOn);
    }
  }
}

// ツールチップを表示する関数
const showTooltip = (event: MouseEvent) => {
  // localStorageにフラグが存在する場合は、ツールチップを表示しない
  if (localStorage.getItem('tooltipDisabled')) {
    return;
  }

  // 既存のツールチップを検索し、あれば削除
  const existingTooltip = document.querySelector('.rubyfuljs-tooltip');
  if (existingTooltip) {
    existingTooltip.remove();
  }

  const target = event.target as HTMLElement;
  // ツールチップ要素の作成
  const tooltip = document.createElement('div');
  const rubyfulButtonUrl = process.env.TERMS_URL;
  tooltip.innerHTML = `<div>ふりがなを自動でふっています。正確にふられない箇所がある可能性がありますが、あらかじめご了承ください。機能の詳細は以下のページをご覧ください。</div><div><a href="${rubyfulButtonUrl}" target="_blank" rel="nofollow noopener">ルビフルボタンについて</a></div>`; // 説明テキスト
  tooltip.className = 'rubyfuljs-tooltip';
  tooltip.style.pointerEvents = 'auto'; // ツールチップ内の要素がクリックイベントを受け取れるようにする
  // ツールチップの位置を設定
  const targetRect = target.getBoundingClientRect();
  tooltip.style.position = 'absolute';
  tooltip.style.bottom = `${window.innerHeight - targetRect.top}px`;
  tooltip.style.right = `${window.innerWidth - targetRect.right}px`;

  // ツールチップをbodyに追加
  document.body.appendChild(tooltip);

  // 閉じるボタンを押したときにツールチップを削除し、localStorageにフラグを保存
  const closeButton = document.createElement('button');
  closeButton.textContent = '×';
  closeButton.className = 'rubyfuljs-tooltip-close-button';
  tooltip.appendChild(closeButton);

  closeButton.addEventListener('click', () => {
    tooltip.remove();
    // ツールチップが閉じられたことをlocalStorageに保存
    localStorage.setItem('tooltipDisabled', 'true');
  }, { once: true });
}

window.addEventListener('load', async () => {
  let isRubyOn = localStorage.getItem('isRubyOn');
  let buttonLabel;
  // 初期状態の設定
  if (isRubyOn === null || isRubyOn === 'true') {
    buttonLabel = 'ルビON';
    isRubyOn = 'true';
    localStorage.setItem('isRubyOn', 'true');
  } else {
    buttonLabel = 'ルビOFF';
    isRubyOn = 'false';
  }

  // ボタンの生成と設定
  const button = document.createElement('button');
  button.type = 'button';
  if (isRubyOn === null || isRubyOn === 'true') {
    button.className = 'rubyfuljs-button is-customized is-ruby-on';
  } else {
    button.className = 'rubyfuljs-button is-customized is-ruby-off';
  }
  button.textContent = buttonLabel;
  button.onclick = () => {
    isRubyOn = localStorage.getItem('isRubyOn');
    if (isRubyOn === 'true') {
      button.textContent = 'ルビOFF';
      button.classList.remove('is-ruby-on');
      button.classList.add('is-ruby-off');
      Array.from(document.querySelectorAll('rt.rubyfuljs-insert') as NodeListOf<HTMLElement>).forEach((element) => {
        element.classList.remove('is-shown')
      });
      isRubyOn = 'false';
      localStorage.setItem('isRubyOn', 'false');
    } else {
      button.textContent = 'ルビON';
      button.classList.remove('is-ruby-off');
      button.classList.add('is-ruby-on');
      Array.from(document.querySelectorAll('rt.rubyfuljs-insert') as NodeListOf<HTMLElement>).forEach((element) => {
        element.classList.add('is-shown')
      });
      isRubyOn = 'true';
      localStorage.setItem('isRubyOn', 'true');
    }
  };
  button.addEventListener('mouseenter', showTooltip);

  try {
    let result;
    if (window.RubyfulJsApp && window.RubyfulJsApp.refPaths && window.RubyfulJsApp.refPaths.length > 0) {
      for (let j = 0; j < window.RubyfulJsApp.refPaths.length; j++) {
        result = document.evaluate(window.RubyfulJsApp.refPaths[j], document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
        // 各要素に対してprocessHtmlWithKuromoji関数を適用します。
        for (let i = 0; i < result.snapshotLength; i++) {
          let element = result.snapshotItem(i) as HTMLElement;
          element.innerHTML = await processHtmlWithKuromoji(element.innerHTML, isRubyOn);
        }
      }
    } else {
      // body内に記述されているHTMLテキストを取得します。
      const originalHtml = document.body.innerHTML;
      // processHtmlWithKuromoji関数にHTMLテキストを与えて、結果を待ちます。
      // 結果をbody内のHTMLテキストとして置換します。
      document.body.innerHTML = await processHtmlWithKuromoji(originalHtml, isRubyOn);
    }
  } catch (error) {
    // エラーが発生した場合、consoleにエラーを表示します。
    console.error('Modified script execution error:', error);
  }

    // ボタンを画面下部に追加
    document.body.appendChild(button);
})
