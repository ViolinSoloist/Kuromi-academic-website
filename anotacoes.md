### Como usar esse padrão no resto do site:
Sempre que você quiser colar um adesivo em outro lugar (por exemplo, no widget do Pomodoro):
1. Adicione a classe `caixa-com-adesivo` no HTML do widget: `<div class="widget pomodoro caixa-com-adesivo">`.
2. Cole a tag `<img src="..." class="adesivo" style="...">` dentro dele.
3. Ajuste o `top`, `bottom`, `left`, `right`, `width` e `transform: rotate()` no `style` até ficar perfeito visualmente.

Dessa forma, o código fica limpo, modular e você ganha total liberdade criativa para espalhar a turma da Sanrio pelo layout sem quebrar a estrutura.

Conseguimos resolver a limitação visual. Você quer aproveitar para testarmos a inserção da terceira imagem agora, ou prefere passarmos para a criação da **Página de Disciplinas** (onde ela controlará as faltas e notas)?