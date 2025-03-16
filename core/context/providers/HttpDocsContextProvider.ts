import { BaseHttpDocsProvider } from "./BaseHttpDocsProvider.js";

class HttpDocsContextProvider extends BaseHttpDocsProvider {
  static override description = BaseHttpDocsProvider.getDescription();
}

export default HttpDocsContextProvider;