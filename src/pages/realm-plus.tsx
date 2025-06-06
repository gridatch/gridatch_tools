import React from "react";
import Seo from "../shared/layout/Seo";
import { PageProps } from "gatsby";
import { RealmPage } from "../features/realm/pages/RealmPage";

const RealmRoute: React.FC<PageProps> = () => {
  return <RealmPage />;
};

export const Head: React.FC = () => <Seo title="領域和了シミュレーター" />;
export default RealmRoute;
