import { useNavigate } from "react-router-dom";

export const useAppNavigate = () => {
  const navigate = useNavigate();

  const appNavigate = (path: string) => {
    navigate(path, {
      replace: location.pathname !== "/home",
      state: { from: "app-navigation" },
    });
  };

  return appNavigate;
};

export default useAppNavigate;
