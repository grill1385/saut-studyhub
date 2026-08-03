# tools

Utilitários de manutenção do hub. Não fazem parte da aplicação (o hub continua a abrir só com
`index.html`, sem build).

## `gen_lab3spec.py`
Regenera `js/data/lab3spec.js` a partir das rotinas da solução do professor guardadas em
`lab3_solution/` (extraídas de `SAUTO/Lab_3/SimTwo_Omni_sol_LabW_3.zip →
RobotFactoryMecanum4Wheel/control.pas`).

```bash
python3 tools/gen_lab3spec.py
node --check js/data/lab3spec.js
```

Editar os testes/dicas **no gerador**, nunca no `lab3spec.js` (é sobrescrito).

## `smoke_hub.js`
Teste ponta-a-ponta com jsdom: carrega todos os scripts do `index.html`, renderiza a Labwork 3,
submete código errado e código equivalente pela UI, e confirma que a solução do professor passa
em todas as tarefas.

```bash
npm install jsdom      # uma vez
node tools/smoke_hub.js
```
