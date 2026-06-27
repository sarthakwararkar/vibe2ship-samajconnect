import { useContext } from "react";
import { AppContext } from "../context/AppContext";

export function useAqi() {
  const { aqiData, loadingAqi, refreshAqi } = useContext(AppContext);
  return { aqi: aqiData, loading: loadingAqi, refreshAqi };
}
