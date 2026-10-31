import { FormField } from "@/src/components/common/form-field";
import { Input } from "@/src/components/ui/input";

export type StoreLocation = { regionCode: string; address: string };

type AddressFieldProps = {
  value: StoreLocation;
  errors: Partial<Record<keyof StoreLocation, string>>;
  onChange: (patch: Partial<StoreLocation>) => void;
};

/**
 * 매장 위치 입력. 네이버 지도 API를 붙일 때 이 컴포넌트만 교체하고 같은 값을 onChange로 넘긴다(D11).
 */
export function AddressField({ value, errors, onChange }: AddressFieldProps) {
  return (
    <>
      <FormField
        id="store-region"
        label="지역"
        required
        hint="소비자가 상품을 찾을 때 쓰는 지역이에요. 예: 마포구"
        error={errors.regionCode}
      >
        {(control) => (
          <Input
            {...control}
            name="regionCode"
            autoComplete="address-level2"
            value={value.regionCode}
            onChange={(e) => onChange({ regionCode: e.target.value })}
          />
        )}
      </FormField>

      <FormField id="store-address" label="주소" required error={errors.address}>
        {(control) => (
          <Input
            {...control}
            name="address"
            autoComplete="street-address"
            value={value.address}
            onChange={(e) => onChange({ address: e.target.value })}
          />
        )}
      </FormField>
    </>
  );
}
