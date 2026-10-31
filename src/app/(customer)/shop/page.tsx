import BrowsePreview from "../../../components/customer/browse-preview";
import styles from "./shop.module.css";
import { filtersFrom, firstValue, loadState, type SearchValues } from "../../../components/customer/preview-state";

export default async function ShopPage({ searchParams }: { searchParams: Promise<SearchValues> }) {
  if (process.env.NODE_ENV !== "development") {
    return <main className={styles.page}><h1>지역별 상품 탐색</h1><p>상품 탐색 화면을 준비하고 있어요. 실제 상품 조회는 아직 연결되지 않았어요.</p></main>;
  }

  const values = await searchParams;
  const scenario = firstValue(values._preview);
  return <BrowsePreview filters={filtersFrom(values)} state={loadState(scenario)} forceEmpty={scenario === "empty"} />;
}
