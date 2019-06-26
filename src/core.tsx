import * as React from "react";
import * as ReactDOM from "react-dom";
import MainModal from "./MainModal";
import { IProviderOptions } from "./types";

import { getInjectProvider } from "./utils";
import connectors from "./connectors";
import EventManager from "./events";

const WEB3_CONNECT_MODAL_ID = "WEB3_CONNECT_MODAL_ID";

interface IWeb3ConnectCoreOptions {
  modal?: boolean;
  lightboxOpacity?: number;
  providerOptions: IProviderOptions;
}

class Web3ConnectCore {
  private uri: string = "";
  private show: boolean = false;
  private eventManager = new EventManager();

  private modal: boolean;
  private injectedProvider: string | null;
  private lightboxOpacity: number;
  private providerOptions: IProviderOptions;

  constructor(opts: IWeb3ConnectCoreOptions) {
    this.modal = typeof opts.modal === "undefined" || opts.modal !== false;
    this.injectedProvider = getInjectProvider();
    this.lightboxOpacity = opts.lightboxOpacity || 0.4;
    this.providerOptions = opts.providerOptions || {};

    if (this.modal) {
      this.renderMainModal();
    }
  }

  public on(event: string, callback: (result: any) => void): void {
    this.eventManager.on({
      event,
      callback
    });
  }

  public connectToInjected = async () => {
    try {
      const provider = await connectors.ConnectToInjected();
      this.onConnect(provider);
    } catch (error) {
      this.onError(error);
    }
  };

  public connectToFortmatic = async () => {
    try {
      const provider = await connectors.ConnectToPortis(
        this.providerOptions.fortmatic
      );
      this.onConnect(provider);
    } catch (error) {
      this.onError(error);
    }
  };

  public connectToPortis = async () => {
    try {
      const provider = await connectors.ConnectToPortis(
        this.providerOptions.portis
      );
      this.onConnect(provider);
    } catch (error) {
      this.onError(error);
    }
  };

  public connectToWalletConnect = async () => {
    if (this.uri) {
      if (this.modal) {
        this.setState({ uri: "" });
      }
      return;
    }
    try {
      const provider = await connectors.ConnectToWalletConnect({
        bridge: this.providerOptions.walletconnect.bridge,
        qrcode: this.modal,
        onUri: (uri: string) => {
          if (this.modal) {
            this.setState({ uri });
          }
        }
      });
      if (this.modal) {
        this.setState({ uri: "" });
      }
      this.onConnect(provider);
    } catch (error) {
      this.onError(error);
    }
  };

  public toggleModal = async () => {
    if (!this.modal) {
      return;
    }
    const d = typeof window !== "undefined" ? document : "";
    const body = d ? d.body || d.getElementsByTagName("body")[0] : "";
    if (body) {
      if (this.show) {
        body.style.position = "";
      } else {
        body.style.position = "fixed";
      }
    }
    this.setState({ show: !this.show });
  };

  private onError = async (error: any) => {
    await this.toggleModal();
    this.eventManager.trigger("error", error);
  };

  private onConnect = async (provider: any) => {
    await this.toggleModal();
    this.eventManager.trigger("connect", provider);
  };

  private onClose = async () => {
    await this.toggleModal();
    this.eventManager.trigger("close");
  };

  private setState = (state: any) => {
    Object.keys(state).forEach(key => {
      this[key] = state[key];
    });
    window.updateWeb3ConnectMainModal(state);
  };

  private resetState = () => {
    this.setState({
      show: false,
      uri: ""
    });
  };

  public renderMainModal() {
    const el = document.createElement("div");
    el.id = WEB3_CONNECT_MODAL_ID;
    document.body.appendChild(el);
    ReactDOM.render(
      <MainModal
        show={this.show}
        uri={this.uri}
        onClose={this.onClose}
        resetState={this.resetState}
        injectedProvider={this.injectedProvider}
        lightboxOpacity={this.lightboxOpacity}
        providerOptions={this.providerOptions}
        connectToInjected={this.connectToInjected}
        connectToFortmatic={this.connectToFortmatic}
        connectToPortis={this.connectToPortis}
        connectToWalletConnect={this.connectToWalletConnect}
      />,
      document.getElementById(WEB3_CONNECT_MODAL_ID)
    );
  }
}

export default Web3ConnectCore;