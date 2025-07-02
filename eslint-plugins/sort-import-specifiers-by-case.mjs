const findLastIndex = (arr, predicate) => {
  for (let i = arr.length - 1; i >= 0; i--) {
    if (predicate(arr[i])) return i;
  }
  return -1;
};

export default {
  rules: {
    'sort-import-specifiers-by-case': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Sort import specifiers by case and optionally add empty lines between groups.',
          category: 'Stylistic Issues',
        },
        fixable: 'code',
        schema: [
          {
            type: 'object',
            properties: {
              groups: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    type: { enum: ['constant', 'type', 'variable'] },
                    pattern: { type: 'string' },
                  },
                  required: ['type', 'pattern'],
                },
              },
              mode: { type: 'string', enum: ['always-inline', 'threshold', 'always-group'], default: 'threshold' },
              threshold: {
                type: 'object',
                properties: {
                  maxLineLength: { type: 'number', default: 80 },
                },
                additionalProperties: false,
              },
              insertEmptyLineBetweenGroups: {
                type: 'boolean',
                default: false,
              },
            },
            additionalProperties: false,
          },
        ],
      },
      create(context) {
        const options = context.options[0] || {};
        const groups = options.groups || [
          { type: 'constant', pattern: '^[A-Z0-9_]+$' },
          { type: 'type', pattern: '^[A-Z][A-Za-z0-9]+$' },
          { type: 'variable', pattern: '^[a-z][A-Za-z0-9]+$' },
        ];
        const mode = options.mode || 'threshold';
        const maxLineLength = (options.threshold && options.threshold.maxLineLength) || 80;
        const insertEmptyLineBetweenGroups = options.insertEmptyLineBetweenGroups ?? false;
        const regexes = groups.map(g => ({ t: g.type, re: new RegExp(g.pattern) }));

        return {
          ImportDeclaration(node) {
            const specs = node.specifiers.filter(s => s.type === 'ImportSpecifier');
            if (specs.length < 2) return;

            const sourceCode = context.getSourceCode();
            const openingBrace = sourceCode.getFirstToken(node, t => t.value === '{');
            const closingBrace = sourceCode.getLastToken(node, t => t.value === '}');
            if (!openingBrace || !closingBrace) return;

            const buckets = {};
            regexes.forEach(({ t }) => {
              buckets[t] = [];
            });
            const others = [];
            specs.forEach(spec => {
              const name = spec.imported.name;
              const bucket = regexes.find(r => r.re.test(name));
              if (bucket) buckets[bucket.t].push(spec);
              else others.push(spec);
            });
            Object.values(buckets).forEach(arr => arr.sort((a, b) => a.imported.name.localeCompare(b.imported.name)));
            others.sort((a, b) => a.imported.name.localeCompare(b.imported.name));

            const all = [];
            regexes.forEach(({ t }) => all.push(...buckets[t]));
            all.push(...others);

            const isSorted = all.every((s, i) => s === specs[i]);

            const inlineText = all.map(s => sourceCode.getText(s)).join(', ');
            const prefixText = sourceCode.text.slice(node.range[0], openingBrace.range[0]);
            const linePrefix = prefixText.substring(prefixText.lastIndexOf('\n') + 1);
            const suffixText = sourceCode.text.slice(closingBrace.range[1], node.range[1]);
            const potentialInlineString = linePrefix + `{ ${inlineText} }` + suffixText;
            const potentialInlineLength = potentialInlineString.length;

            let shouldBeGrouped = false;
            if (mode === 'always-group') {
              shouldBeGrouped = true;
            } else if (mode === 'threshold') {
              shouldBeGrouped = potentialInlineLength > maxLineLength;
            }

            let idealText;
            const importIndentation = ' '.repeat(node.loc.start.column);
            const specifiersIndentation = importIndentation + '  ';

            if (shouldBeGrouped) {
              const lines = [];
              let currentLine = '';

              const specToTypeMap = new Map();
              Object.entries(buckets).forEach(([type, specs]) => {
                specs.forEach(spec => specToTypeMap.set(spec, type));
              });
              others.forEach(spec => specToTypeMap.set(spec, 'other'));

              all.forEach((spec, index) => {
                const specText = sourceCode.getText(spec);
                const prevSpec = all[index - 1];
                const isNewGroup = index > 0 && specToTypeMap.get(spec) !== specToTypeMap.get(prevSpec);

                if (isNewGroup && currentLine) {
                  lines.push(currentLine);
                  if (insertEmptyLineBetweenGroups) {
                    lines.push('');
                  }
                  currentLine = specText;
                  return;
                }

                if (currentLine === '') {
                  currentLine = specText;
                } else {
                  const potentialLine = `${currentLine}, ${specText}`;
                  // 行末カンマ(1文字)の長さを考慮して比較する
                  if (specifiersIndentation.length + potentialLine.length + 1 > maxLineLength) {
                    lines.push(currentLine);
                    currentLine = specText;
                  } else {
                    currentLine = potentialLine;
                  }
                }
              });
              if (currentLine) lines.push(currentLine);

              const lastNonEmptyLineIndex = findLastIndex(lines, line => line !== '');
              const finalLines = lines.map((line, index) => {
                if (line !== '' && index < lastNonEmptyLineIndex) {
                  return line + ',';
                }
                return line;
              });

              const content = finalLines.join(`\n${specifiersIndentation}`);
              const trailingComma = lastNonEmptyLineIndex !== -1 ? ',' : '';
              idealText = `\n${specifiersIndentation}${content}${trailingComma}\n${importIndentation}`;
            } else {
              idealText = ` ${inlineText} `;
            }

            const currentText = sourceCode.text.slice(openingBrace.range[1], closingBrace.range[0]);
            if (isSorted && currentText === idealText) {
              return;
            }

            context.report({
              node,
              message: 'Import specifiers should be sorted by case and formatted for line length.',
              fix(fixer) {
                return fixer.replaceTextRange([openingBrace.range[1], closingBrace.range[0]], idealText);
              },
            });
          },
        };
      },
    },
  },
};
