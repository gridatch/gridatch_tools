import React from "react";
import Seo from "../components/layout/seo";
import { PageProps } from "gatsby";
import { ManmanPage } from "../features/wait/manman/pages/Page";

const ManmanRoute: React.FC<PageProps> = () => {
  return <ManmanPage />;
};

export const Head: React.FC = () => <Seo title="万万シミュレーター" />;
export default ManmanRoute;
