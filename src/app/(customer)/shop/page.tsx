import BrowsePreview from "../../../components/customer/browse-preview";
import { filtersFrom, firstValue, loadState, type SearchValues } from "../../../components/customer/preview-state";

export default async function ShopPage({ searchParams }: { searchParams: Promise<SearchValues> }) {
  const values = await searchParams;
  const scenario = firstValue(values._preview);
  return <BrowsePreview filters={filtersFrom(values)} state={loadState(scenario)} forceEmpty={scenario === "empty"} />;
}
