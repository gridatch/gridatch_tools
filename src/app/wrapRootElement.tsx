import React from "react";
import { ProcessingProvider } from "../shared/processing/context/ProcessingContext";
import { GatsbyBrowser, GatsbySSR, WrapRootElementNodeArgs } from "gatsby";

type WrapRootElement = GatsbyBrowser["wrapRootElement"] | GatsbySSR["wrapRootElement"];

export const wrapRootElement: WrapRootElement = ({ element }: WrapRootElementNodeArgs) => (
  <ProcessingProvider>
    { element }
  </ProcessingProvider>
);