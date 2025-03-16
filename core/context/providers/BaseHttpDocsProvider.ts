import {
  ContextItem,
  ContextProviderDescription,
  ContextProviderExtras,
  ContextSubmenuItem,
} from "../../index.js";
import { BaseContextProvider } from "../index.js";

interface HttpEndpoint {
  url: string;
  displayTitle?: string;
  description?: string;
}

export abstract class BaseHttpDocsProvider extends BaseContextProvider {
  static getDescription(suffix: string = ''): ContextProviderDescription {
    return {
      title: `httpdocs${suffix}`,
      displayTitle: `HTTP Docs${suffix}`,
      description: "Retrieve a Context",
      type: "submenu",
      renderInlineAs: "",
    };
  }

  override get description(): ContextProviderDescription {
    const constructorDescription = (this.constructor as typeof BaseHttpDocsProvider).getDescription();
    return {
      title: this.options.title || constructorDescription.title,
      displayTitle: this.options.displayTitle || constructorDescription.displayTitle,
      description: this.options.description || constructorDescription.description,
      type: "submenu",
      renderInlineAs: this.options.renderInlineAs || constructorDescription.renderInlineAs,
    };
  }

  async loadSubmenuItems(): Promise<ContextSubmenuItem[]> {
    const endpoints: Record<string, HttpEndpoint> = this.options.endpoints || {};
    
    return Object.entries(endpoints).map(([key, endpoint]) => ({
      id: key,
      title: endpoint.displayTitle || key,
      label: endpoint.displayTitle || key,
      description: endpoint.description || endpoint.url,
      url: endpoint.url,
    }));
  }

  async getContextItems(
    query: string,
    extras: ContextProviderExtras,
  ): Promise<ContextItem[]> {
    const endpoints: Record<string, HttpEndpoint> = this.options.endpoints || {};
    const endpoint = endpoints[query];
    if (!endpoint) {
      console.warn(`Endpoint not found for key: ${query}`);
      return [];
    }

    const response = await extras.fetch(new URL(endpoint.url), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: extras.fullInput || "",
        fullInput: extras.fullInput,
        options: this.options.options,
      }),
    });

    const json = await response.json();

    try {
      const createContextItem = (item: any) => ({
        description: item.description ?? "HTTP Context Item",
        content: item.content ?? "",
        name: item.name ?? this.options.title ?? "HTTP",
      });

      return Array.isArray(json)
        ? json.map(createContextItem)
        : [createContextItem(json)];
    } catch (e) {
      console.warn(
        `Failed to parse response from custom HTTP context provider.\nError:\n${e}\nResponse from server:\n`,
        json,
      );
      return [];
    }
  }
} 