import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

async function main() {
  const esbuild = await import('esbuild');

  async function buildAndGetMetas(entryPoint, name) {
    // Bundle everything into one file
    const result = await esbuild.build({
      entryPoints: [entryPoint],
      bundle: true,
      format: 'esm',
      platform: 'node',
      write: false,
      external: [],  // bundle everything
      plugins: [{
        name: 'resolve-aliases',
        setup(build) {
          build.onResolve({ filter: /^@\// }, args => {
            return { path: resolve(root, 'src', args.path.slice(2) + '.ts') };
          });
        }
      }]
    });

    let code = result.outputFiles[0].text;
    // Remove import of non-existent modules
    code = code.replace(/import\s+['"][^'"]*\.css['"]\s*;?\n?/g, '');
    code = code.replace(/import\s+['"][^'"]*\.json['"]\s*;?\n?/g, '');
    
    const tmpDir = resolve(root, 'scripts/.gen');
    if (!existsSync(tmpDir)) mkdirSync(tmpDir, { recursive: true });
    
    const tmpFile = resolve(tmpDir, 'bundle-' + name + '.mjs');
    writeFileSync(tmpFile, code);
    
    const mod = await import('file:///' + tmpFile.replace(/\\/g, '/'));
    
    if (name === 'ru') return mod.BLOG_POST_METAS;
    if (name === 'uk') return mod.BLOG_POST_METAS_UK;
    throw new Error('Unknown name: ' + name);
  }

  const fields = ['slug','title','description','metaDescription','keywords','categorySlug','categoryName','datePublished','dateModified','author','readingTime','image','imageAlt'];

  function genSource(items, exportName) {
    let src = `import type { BlogPost } from '@/types'\n\n`;
    src += `// ── Static meta array — no bodies, safe for client import ──\n\n`;
    src += `export const ${exportName}: Omit<BlogPost, 'body'>[] = [\n`;
    for (const item of items) {
      src += `  {\n`;
      for (const f of fields) {
        let v = item[f];
        if (v === undefined || v === null) continue;
        if (Array.isArray(v)) {
          src += `    ${f}: [${v.map(x => JSON.stringify(x)).join(', ')}],\n`;
        } else if (typeof v === 'string') {
          src += `    ${f}: ${JSON.stringify(v)},\n`;
        } else {
          src += `    ${f}: ${v},\n`;
        }
      }
      src += `  },\n`;
    }
    src += `];\n`;
    return src;
  }

  const metasRu = await buildAndGetMetas(resolve(root, 'src/content/blog/index.ts'), 'ru');
  const ruSource = genSource(metasRu, 'BLOG_POST_METAS');
  writeFileSync(resolve(root, 'src/content/blog/metas.ts'), ruSource);
  console.log(`✓ src/content/blog/metas.ts (${metasRu.length} posts, ${(new Blob([ruSource]).size / 1024).toFixed(1)}KB)`);

  const metasUk = await buildAndGetMetas(resolve(root, 'src/content/blog/index-uk.ts'), 'uk');
  const ukSource = genSource(metasUk, 'BLOG_POST_METAS_UK');
  writeFileSync(resolve(root, 'src/content/blog/metas-uk.ts'), ukSource);
  console.log(`✓ src/content/blog/metas-uk.ts (${metasUk.length} posts, ${(new Blob([ukSource]).size / 1024).toFixed(1)}KB)`);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
