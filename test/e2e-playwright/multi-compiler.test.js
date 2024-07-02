"use strict";

const path = require("path");
const fs = require("graceful-fs");
const webpack = require("webpack");
const { test } = require("@playwright/test");
const { describe } = require("@playwright/test");
const { expect } = require("@playwright/test");
const Server = require("../../lib/Server");
const oneWebTargetConfiguration = require("../fixtures/multi-compiler-one-configuration/webpack.config");
const twoWebTargetConfiguration = require("../fixtures/multi-compiler-two-configurations/webpack.config");
const universalConfiguration = require("../fixtures/universal-compiler-config/webpack.config");
const port = require("../ports-map")["multi-compiler"];

describe("multi compiler", () => {
  test(`should work with one web target configuration and do nothing`, async ({
    page,
  }) => {
    const compiler = webpack(oneWebTargetConfiguration);
    const devServerOptions = {
      port,
    };
    const server = new Server(devServerOptions, compiler);

    await server.start();

    try {
      const pageErrors = [];
      const consoleMessages = [];

      page
        .on("console", (message) => {
          consoleMessages.push(message.text());
        })
        .on("pageerror", (error) => {
          pageErrors.push(error);
        });

      await page.goto(`http://127.0.0.1:${port}/`, {
        waitUntil: "networkidle0",
      });

      expect(JSON.stringify(consoleMessages)).toMatchSnapshot();
      expect(JSON.stringify(pageErrors)).toMatchSnapshot();
    } catch (error) {
      throw error;
    } finally {
      await server.stop();
    }
  });

  test(`should work with web target configurations and do nothing`, async ({
    page,
  }) => {
    const compiler = webpack(twoWebTargetConfiguration);
    const devServerOptions = {
      port,
    };

    const server = new Server(devServerOptions, compiler);

    await server.start();

    try {
      let pageErrors = [];
      let consoleMessages = [];

      page
        .on("console", (message) => {
          consoleMessages.push(message.text());
        })
        .on("pageerror", (error) => {
          pageErrors.push(error);
        });

      await page.goto(`http://127.0.0.1:${port}/one-main.html`, {
        waitUntil: "networkidle0",
      });

      expect(JSON.stringify(consoleMessages)).toMatchSnapshot();
      expect(JSON.stringify(pageErrors)).toMatchSnapshot();

      pageErrors = [];
      consoleMessages = [];

      await page.goto(`http://127.0.0.1:${port}/two-main.html`, {
        waitUntil: "networkidle0",
      });

      expect(JSON.stringify(consoleMessages)).toMatchSnapshot();
      expect(JSON.stringify(pageErrors)).toMatchSnapshot();
    } catch (error) {
      throw error;
    } finally {
      await server.stop();
    }
  });

  test(`should work with web target configurations when hot and live reloads are enabled, and do hot reload by default when changing own entries`, async ({
    page,
  }) => {
    const compiler = webpack(twoWebTargetConfiguration);
    const devServerOptions = {
      port,
      hot: true,
      liveReload: true,
    };
    const pathToOneEntry = path.resolve(
      __dirname,
      "../fixtures/multi-compiler-two-configurations/one.js",
    );
    const originalOneEntryContent = fs.readFileSync(pathToOneEntry);
    const pathToTwoEntry = path.resolve(
      __dirname,
      "../fixtures/multi-compiler-two-configurations/two.js",
    );
    const originalTwoEntryContent = fs.readFileSync(pathToTwoEntry);

    const server = new Server(devServerOptions, compiler);

    await server.start();

    try {
      let pageErrors = [];
      let consoleMessages = [];

      page
        .on("console", (message) => {
          let text = message.text();

          if (/Error: Aborted because/.test(text)) {
            const splittedText = text.split("\n");

            text = `${splittedText[0]}\n${splittedText[1]}\n    <stack>`;
          }

          consoleMessages.push(text);
        })
        .on("pageerror", (error) => {
          pageErrors.push(error);
        });

      await page.goto(`http://127.0.0.1:${port}/one-main.html`, {
        waitUntil: "networkidle0",
      });

      fs.writeFileSync(pathToOneEntry, `${originalOneEntryContent}// comment`);

      await page.waitForNavigation({ waitUntil: "networkidle0" });

      expect(JSON.stringify(consoleMessages)).toMatchSnapshot();
      expect(JSON.stringify(pageErrors)).toMatchSnapshot();

      pageErrors = [];
      consoleMessages = [];

      await page.goto(`http://127.0.0.1:${port}/two-main.html`, {
        waitUntil: "networkidle0",
      });

      fs.writeFileSync(pathToTwoEntry, `${originalTwoEntryContent}// comment`);

      await page.waitForNavigation({ waitUntil: "networkidle0" });

      expect(JSON.stringify(consoleMessages)).toMatchSnapshot();
      expect(JSON.stringify(pageErrors)).toMatchSnapshot();
    } catch (error) {
      throw error;
    } finally {
      await server.stop();

      fs.writeFileSync(pathToOneEntry, originalOneEntryContent);
      fs.writeFileSync(pathToTwoEntry, originalTwoEntryContent);
    }
  });

  test(`should work with web target configurations when only hot reload is enabled, and do hot reload when changing own entries`, async ({
    page,
  }) => {
    const compiler = webpack(twoWebTargetConfiguration);
    const devServerOptions = {
      port,
      hot: true,
      liveReload: false,
    };
    const pathToOneEntry = path.resolve(
      __dirname,
      "../fixtures/multi-compiler-two-configurations/one.js",
    );
    const originalOneEntryContent = fs.readFileSync(pathToOneEntry);
    const pathToTwoEntry = path.resolve(
      __dirname,
      "../fixtures/multi-compiler-two-configurations/two.js",
    );
    const originalTwoEntryContent = fs.readFileSync(pathToTwoEntry);

    const server = new Server(devServerOptions, compiler);

    await server.start();

    try {
      let pageErrors = [];
      let consoleMessages = [];

      page
        .on("console", (message) => {
          let text = message.text();

          if (/Error: Aborted because/.test(text)) {
            const splittedText = text.split("\n");

            text = `${splittedText[0]}\n${splittedText[1]}\n    <stack>`;
          }

          consoleMessages.push(text);
        })
        .on("pageerror", (error) => {
          pageErrors.push(error);
        });

      await page.goto(`http://127.0.0.1:${port}/one-main.html`, {
        waitUntil: "networkidle0",
      });

      fs.writeFileSync(pathToOneEntry, `${originalOneEntryContent}// comment`);

      await page.waitForNavigation({ waitUntil: "networkidle0" });

      expect(JSON.stringify(consoleMessages)).toMatchSnapshot();
      expect(JSON.stringify(pageErrors)).toMatchSnapshot();

      pageErrors = [];
      consoleMessages = [];

      await page.goto(`http://127.0.0.1:${port}/two-main.html`, {
        waitUntil: "networkidle0",
      });

      fs.writeFileSync(pathToTwoEntry, `${originalTwoEntryContent}// comment`);

      await page.waitForNavigation({ waitUntil: "networkidle0" });

      expect(JSON.stringify(consoleMessages)).toMatchSnapshot();
      expect(JSON.stringify(pageErrors)).toMatchSnapshot();
    } catch (error) {
      throw error;
    } finally {
      await server.stop();

      fs.writeFileSync(pathToOneEntry, originalOneEntryContent);
      fs.writeFileSync(pathToTwoEntry, originalTwoEntryContent);
    }
  });

  test(`should work with web target configurations when only live reload is enabled, and do live reload when changing own entries`, async ({
    page,
  }) => {
    const compiler = webpack(twoWebTargetConfiguration);
    const devServerOptions = {
      port,
      hot: false,
      liveReload: true,
    };
    const pathToOneEntry = path.resolve(
      __dirname,
      "../fixtures/multi-compiler-two-configurations/one.js",
    );
    const originalOneEntryContent = fs.readFileSync(pathToOneEntry);
    const pathToTwoEntry = path.resolve(
      __dirname,
      "../fixtures/multi-compiler-two-configurations/two.js",
    );
    const originalTwoEntryContent = fs.readFileSync(pathToTwoEntry);

    const server = new Server(devServerOptions, compiler);

    await server.start();

    try {
      let pageErrors = [];
      let consoleMessages = [];

      page
        .on("console", (message) => {
          consoleMessages.push(message.text());
        })
        .on("pageerror", (error) => {
          pageErrors.push(error);
        });

      await page.goto(`http://127.0.0.1:${port}/one-main.html`, {
        waitUntil: "networkidle0",
      });

      fs.writeFileSync(pathToOneEntry, `${originalOneEntryContent}// comment`);

      await page.waitForNavigation({ waitUntil: "networkidle0" });

      expect(JSON.stringify(consoleMessages)).toMatchSnapshot();
      expect(JSON.stringify(pageErrors)).toMatchSnapshot();

      pageErrors = [];
      consoleMessages = [];

      await page.goto(`http://127.0.0.1:${port}/two-main.html`, {
        waitUntil: "networkidle0",
      });

      fs.writeFileSync(pathToTwoEntry, `${originalTwoEntryContent}// comment`);

      await page.waitForNavigation({ waitUntil: "networkidle0" });

      expect(JSON.stringify(consoleMessages)).toMatchSnapshot();
      expect(JSON.stringify(pageErrors)).toMatchSnapshot();
    } catch (error) {
      throw error;
    } finally {
      await server.stop();

      fs.writeFileSync(pathToOneEntry, originalOneEntryContent);
      fs.writeFileSync(pathToTwoEntry, originalTwoEntryContent);
    }
  });

  test(`should work with web target configurations when only live reload is enabled and do live reload when changing other entries`, async ({
    page,
  }) => {
    const compiler = webpack(twoWebTargetConfiguration);
    const devServerOptions = {
      port,
      hot: false,
      liveReload: true,
    };
    const pathToOneEntry = path.resolve(
      __dirname,
      "../fixtures/multi-compiler-two-configurations/one.js",
    );
    const originalOneEntryContent = fs.readFileSync(pathToOneEntry);
    const pathToTwoEntry = path.resolve(
      __dirname,
      "../fixtures/multi-compiler-two-configurations/two.js",
    );
    const originalTwoEntryContent = fs.readFileSync(pathToTwoEntry);

    const server = new Server(devServerOptions, compiler);

    await server.start();

    try {
      let pageErrors = [];
      let consoleMessages = [];

      page
        .on("console", (message) => {
          consoleMessages.push(message.text());
        })
        .on("pageerror", (error) => {
          pageErrors.push(error);
        });

      await page.goto(`http://127.0.0.1:${port}/one-main.html`, {
        waitUntil: "networkidle0",
      });

      fs.writeFileSync(pathToTwoEntry, `${originalTwoEntryContent}// comment`);

      await page.waitForNavigation({ waitUntil: "networkidle0" });

      expect(JSON.stringify(consoleMessages)).toMatchSnapshot();
      expect(JSON.stringify(pageErrors)).toMatchSnapshot();

      pageErrors = [];
      consoleMessages = [];

      await page.goto(`http://127.0.0.1:${port}/two-main.html`, {
        waitUntil: "networkidle0",
      });

      fs.writeFileSync(pathToOneEntry, `${originalOneEntryContent}// comment`);

      await page.waitForNavigation({ waitUntil: "networkidle0" });

      expect(JSON.stringify(consoleMessages)).toMatchSnapshot();
      expect(JSON.stringify(pageErrors)).toMatchSnapshot();
    } catch (error) {
      throw error;
    } finally {
      await server.stop();

      fs.writeFileSync(pathToOneEntry, originalOneEntryContent);
      fs.writeFileSync(pathToTwoEntry, originalTwoEntryContent);
    }
  });

  test("should work with universal configuration and do nothing", async ({
    page,
  }) => {
    const compiler = webpack(universalConfiguration);
    const devServerOptions = {
      port,
    };
    const server = new Server(devServerOptions, compiler);

    await server.start();

    const pageErrors = [];
    const consoleMessages = [];
    try {
      const serverResponse = await page.goto(
        `http://127.0.0.1:${port}/server.js`,
        {
          waitUntil: "networkidle0",
        },
      );

      const serverResponseText = await serverResponse.text();

      expect(serverResponseText).toContain("Hello from the server");
      expect(serverResponseText).not.toContain("WebsocketServer");

      page
        .on("console", (message) => {
          consoleMessages.push(message.text());
        })
        .on("pageerror", (error) => {
          pageErrors.push(error);
        });

      await page.goto(`http://127.0.0.1:${port}/browser.html`, {
        waitUntil: "networkidle0",
      });
    } catch (error) {
      throw error;
    } finally {
      await server.stop();
    }

    expect(JSON.stringify(consoleMessages)).toMatchSnapshot();
    expect(JSON.stringify(pageErrors)).toMatchSnapshot();
  });

  test(`should work with universal configuration when hot and live reloads are enabled, and do hot reload for browser compiler by default when browser entry changed`, async ({
    page,
  }) => {
    const compiler = webpack(universalConfiguration);
    const devServerOptions = {
      port,
      hot: true,
      liveReload: true,
    };
    const pathToBrowserEntry = path.resolve(
      __dirname,
      "../fixtures/universal-compiler-config/browser.js",
    );
    const originalBrowserEntryContent = fs.readFileSync(pathToBrowserEntry);
    const pathToServerEntry = path.resolve(
      __dirname,
      "../fixtures/universal-compiler-config/server.js",
    );
    const originalServerEntryContent = fs.readFileSync(pathToServerEntry);

    const server = new Server(devServerOptions, compiler);

    await server.start();

    try {
      const serverResponse = await page.goto(
        `http://127.0.0.1:${port}/server.js`,
        {
          waitUntil: "networkidle0",
        },
      );

      const serverResponseText = await serverResponse.text();

      expect(serverResponseText).toContain("Hello from the server");
      expect(serverResponseText).not.toContain("WebsocketServer");

      const pageErrors = [];
      const consoleMessages = [];

      page
        .on("console", (message) => {
          let text = message.text();

          if (/Error: Aborted because/.test(text)) {
            const splittedText = text.split("\n");

            text = `${splittedText[0]}\n${splittedText[1]}\n    <stack>`;
          }

          consoleMessages.push(text);
        })
        .on("pageerror", (error) => {
          pageErrors.push(error);
        });

      await page.goto(`http://127.0.0.1:${port}/browser.html`, {
        waitUntil: "networkidle0",
      });

      fs.writeFileSync(
        pathToBrowserEntry,
        `${originalBrowserEntryContent}// comment`,
      );

      await page.waitForNavigation({ waitUntil: "networkidle0" });

      expect(JSON.stringify(consoleMessages)).toMatchSnapshot();
      expect(JSON.stringify(pageErrors)).toMatchSnapshot();
    } catch (error) {
      throw error;
    } finally {
      await server.stop();

      fs.writeFileSync(pathToBrowserEntry, originalBrowserEntryContent);
      fs.writeFileSync(pathToServerEntry, originalServerEntryContent);
    }
  });

  test(`should work with universal configuration when only hot reload is enabled, and do hot reload for browser compiler when browser entry changed`, async ({
    page,
  }) => {
    const compiler = webpack(universalConfiguration);
    const devServerOptions = {
      port,
      hot: true,
      liveReload: false,
    };
    const pathToBrowserEntry = path.resolve(
      __dirname,
      "../fixtures/universal-compiler-config/browser.js",
    );
    const originalBrowserEntryContent = fs.readFileSync(pathToBrowserEntry);

    const server = new Server(devServerOptions, compiler);

    await server.start();

    try {
      const serverResponse = await page.goto(
        `http://127.0.0.1:${port}/server.js`,
        {
          waitUntil: "networkidle0",
        },
      );

      const serverResponseText = await serverResponse.text();

      expect(serverResponseText).toContain("Hello from the server");
      expect(serverResponseText).not.toContain("WebsocketServer");

      const pageErrors = [];
      const consoleMessages = [];

      page
        .on("console", (message) => {
          let text = message.text();

          if (/Error: Aborted because/.test(text)) {
            const splittedText = text.split("\n");

            text = `${splittedText[0]}\n${splittedText[1]}\n    <stack>`;
          }

          consoleMessages.push(text);
        })
        .on("pageerror", (error) => {
          pageErrors.push(error);
        });

      await page.goto(`http://127.0.0.1:${port}/browser.html`, {
        waitUntil: "networkidle0",
      });

      fs.writeFileSync(
        pathToBrowserEntry,
        `${originalBrowserEntryContent}// comment`,
      );

      await page.waitForNavigation({ waitUntil: "networkidle0" });

      expect(JSON.stringify(consoleMessages)).toMatchSnapshot();
      expect(JSON.stringify(pageErrors)).toMatchSnapshot();
    } catch (error) {
      throw error;
    } finally {
      await server.stop();

      fs.writeFileSync(pathToBrowserEntry, originalBrowserEntryContent);
    }
  });

  test(`should work with universal configuration when only live reload is enabled, and do live reload for browser compiler when changing browser and server entries`, async ({
    page,
  }) => {
    const compiler = webpack(universalConfiguration);
    const devServerOptions = {
      port,
      hot: false,
      liveReload: true,
    };
    const pathToBrowserEntry = path.resolve(
      __dirname,
      "../fixtures/universal-compiler-config/browser.js",
    );
    const originalBrowserEntryContent = fs.readFileSync(pathToBrowserEntry);
    const pathToServerEntry = path.resolve(
      __dirname,
      "../fixtures/universal-compiler-config/server.js",
    );
    const originalServerEntryContent = fs.readFileSync(pathToServerEntry);

    const server = new Server(devServerOptions, compiler);

    await server.start();

    try {
      const serverResponse = await page.goto(
        `http://127.0.0.1:${port}/server.js`,
        {
          waitUntil: "networkidle0",
        },
      );

      const serverResponseText = await serverResponse.text();

      expect(serverResponseText).toContain("Hello from the server");
      expect(serverResponseText).not.toContain("WebsocketServer");

      let pageErrors = [];
      let consoleMessages = [];

      page
        .on("console", (message) => {
          consoleMessages.push(message.text());
        })
        .on("pageerror", (error) => {
          pageErrors.push(error);
        });

      await page.goto(`http://127.0.0.1:${port}/browser.html`, {
        waitUntil: "networkidle0",
      });

      fs.writeFileSync(
        pathToBrowserEntry,
        `${originalBrowserEntryContent}// comment`,
      );

      await page.waitForNavigation({ waitUntil: "networkidle0" });

      expect(JSON.stringify(consoleMessages)).toMatchSnapshot();
      expect(JSON.stringify(pageErrors)).toMatchSnapshot();

      pageErrors = [];
      consoleMessages = [];

      await page.goto(`http://127.0.0.1:${port}/browser.html`, {
        waitUntil: "networkidle0",
      });

      fs.writeFileSync(
        pathToServerEntry,
        `${originalServerEntryContent}// comment`,
      );

      await page.waitForNavigation({ waitUntil: "networkidle0" });

      expect(JSON.stringify(consoleMessages)).toMatchSnapshot();
      expect(JSON.stringify(pageErrors)).toMatchSnapshot();
    } catch (error) {
      throw error;
    } finally {
      await server.stop();

      fs.writeFileSync(pathToBrowserEntry, originalBrowserEntryContent);
      fs.writeFileSync(pathToServerEntry, originalServerEntryContent);
    }
  });

  test(`should work with universal configuration when only live reload is enabled, and do live reload for browser compiler when changing server and browser entries`, async ({
    page,
  }) => {
    const compiler = webpack(universalConfiguration);
    const devServerOptions = {
      port,
      hot: false,
      liveReload: true,
    };
    const pathToBrowserEntry = path.resolve(
      __dirname,
      "../fixtures/universal-compiler-config/browser.js",
    );
    const originalBrowserEntryContent = fs.readFileSync(pathToBrowserEntry);
    const pathToServerEntry = path.resolve(
      __dirname,
      "../fixtures/universal-compiler-config/server.js",
    );
    const originalServerEntryContent = fs.readFileSync(pathToServerEntry);

    const server = new Server(devServerOptions, compiler);

    await server.start();

    try {
      const serverResponse = await page.goto(
        `http://127.0.0.1:${port}/server.js`,
        {
          waitUntil: "networkidle0",
        },
      );

      const serverResponseText = await serverResponse.text();

      expect(serverResponseText).toContain("Hello from the server");
      expect(serverResponseText).not.toContain("WebsocketServer");

      let pageErrors = [];
      let consoleMessages = [];

      page
        .on("console", (message) => {
          consoleMessages.push(message.text());
        })
        .on("pageerror", (error) => {
          pageErrors.push(error);
        });

      await page.goto(`http://127.0.0.1:${port}/browser.html`, {
        waitUntil: "networkidle0",
      });

      fs.writeFileSync(
        pathToServerEntry,
        `${originalServerEntryContent}// comment`,
      );

      await page.waitForNavigation({ waitUntil: "networkidle0" });

      expect(JSON.stringify(consoleMessages)).toMatchSnapshot();
      expect(JSON.stringify(pageErrors)).toMatchSnapshot();

      pageErrors = [];
      consoleMessages = [];

      await page.goto(`http://127.0.0.1:${port}/browser.html`, {
        waitUntil: "networkidle0",
      });

      fs.writeFileSync(
        pathToBrowserEntry,
        `${originalBrowserEntryContent}// comment`,
      );

      await page.waitForNavigation({ waitUntil: "networkidle0" });

      expect(JSON.stringify(consoleMessages)).toMatchSnapshot();
      expect(JSON.stringify(pageErrors)).toMatchSnapshot();
    } catch (error) {
      throw error;
    } finally {
      await server.stop();

      fs.writeFileSync(pathToBrowserEntry, originalBrowserEntryContent);
      fs.writeFileSync(pathToServerEntry, originalServerEntryContent);
    }
  });
});