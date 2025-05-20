import React from "react";
import Seo from "../components/layout/seo"
import { PageProps } from "gatsby";
import { RealmViewerPage } from "../features/realmViewer/pages/Page";

const RealmViewerRoute: React.FC<PageProps> = () => {
  return <RealmViewerPage />;
};

export const Head: React.FC = () => <Seo title="領域牌表示ツール" />;
export default RealmViewerRoute;
