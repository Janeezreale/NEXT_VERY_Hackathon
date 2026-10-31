// App 기반 파일이 준비되기 전의 격리 미리보기. 임시 앱만 생성하며 원본 앱은 수정하지 않습니다.
import { mkdtemp, cp, writeFile, symlink, rm, access } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const source = dirname(fileURLToPath(import.meta.url));
const root = resolve(source, "../../../../..");
await access(join(root, "node_modules/next/dist/bin/next"));
const preview = await mkdtemp(join(tmpdir(), "seller-products-demo-"));
await cp(source, join(preview, "app/seller/products"), { recursive: true, filter: (path) => !path.endsWith("preview.mjs") });
await symlink(join(root, "node_modules"), join(preview, "node_modules"), "dir");
await writeFile(join(preview, "package.json"), JSON.stringify({ private: true, scripts: {}, dependencies: { next: "16.4.3", react: "19.3.1", "react-dom": "19.3.1" } }));
await writeFile(join(preview, "app/layout.tsx"), 'export default function Layout({ children }: { children: React.ReactNode }) { return <html lang="ko"><body style={{ margin: 0 }}>{children}</body></html>; }');
const building = process.argv.includes("--build");
console.log(building ? "격리된 상품 데모의 프로덕션 빌드를 검사합니다." : "격리된 데모: http://127.0.0.1:3100/seller/products");
if (!building) console.log("상품 데이터는 메모리에만 있으며 서버·DB 연동은 없습니다. 종료: Ctrl+C");
const args = building ? ["build", "--webpack"] : ["dev", "--webpack", "--hostname", "127.0.0.1", "--port", "3100"];
const child = spawn(process.execPath, [join(root, "node_modules/next/dist/bin/next"), ...args], { cwd: preview, stdio: "inherit", env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" } });
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => child.kill(signal));
child.on("exit", async (code) => { await rm(preview, { recursive: true, force: true }); process.exitCode = code ?? 0; });
