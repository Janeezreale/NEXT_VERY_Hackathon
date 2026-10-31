// 판매자 UI 네 화면만 복사하는 격리된 미리보기입니다.
import { mkdtemp, cp, writeFile, symlink, rm, access } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const source = dirname(fileURLToPath(import.meta.url));
const root = resolve(source, "../../../../..");
await access(join(root, "node_modules/next/dist/bin/next"));
const preview = await mkdtemp(join(tmpdir(), "seller-dashboard-demo-"));
const copyOptions = { recursive: true, filter: (path) => !path.endsWith("preview.mjs") };
await cp(source, join(preview, "app/seller/dashboard"), copyOptions);
await cp(join(source, "../products"), join(preview, "app/seller/products"), copyOptions);
await cp(join(source, "../reservations"), join(preview, "app/seller/reservations"), copyOptions);
await cp(join(source, "../reports"), join(preview, "app/seller/reports"), copyOptions);
await symlink(join(root, "node_modules"), join(preview, "node_modules"), "dir");
await writeFile(join(preview, "package.json"), JSON.stringify({ private: true, dependencies: { next: "16.4.3", react: "19.3.1", "react-dom": "19.3.1" } }));
await writeFile(join(preview, "app/layout.tsx"), 'export default function Layout({ children }: { children: React.ReactNode }) { return <html lang="ko"><body style={{ margin: 0 }}>{children}</body></html>; }');
const building = process.argv.includes("--build");
console.log(building ? "격리된 판매자 데모를 빌드합니다." : "판매자 대시보드: http://127.0.0.1:3101/seller/dashboard");
if (!building) console.log("DB·API 연동 없는 개발용 데모입니다. 종료: Ctrl+C");
const args = building ? ["build", "--webpack"] : ["dev", "--webpack", "--hostname", "127.0.0.1", "--port", "3101"];
const child = spawn(process.execPath, [join(root, "node_modules/next/dist/bin/next"), ...args], { cwd: preview, stdio: "inherit", env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" } });
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => child.kill(signal));
child.on("exit", async (code) => { await rm(preview, { recursive: true, force: true }); process.exitCode = code ?? 0; });
