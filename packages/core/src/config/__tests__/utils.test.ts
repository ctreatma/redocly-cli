import { DeprecatedInRawConfig, RawConfig, FlatRawConfig } from '../types';
import * as utils from '../utils';

const makeTestRawConfig = (
  apiStyleguideName: string,
  rootStyleguideName: string
): RawConfig & DeprecatedInRawConfig => ({
  apis: {
    'test@v1': {
      root: 'root.yaml',
      [apiStyleguideName]: {
        rules: {
          'operation-2xx-response': 'error',
        },
      },
    },
  },
  [rootStyleguideName]: {
    rules: {
      'operation-4xx-response': 'warn',
    },
  },
});

const rawTestConfig: RawConfig = {
  apis: {
    'test@v1': {
      root: 'root.yaml',
      styleguide: {
        extends: ['recommended'],
        rules: { 'operation-2xx-response': 'error' },
      },
    },
  },
  styleguide: {
    plugins: ['test-plugin'],
    extends: ['minimal'],
    rules: { 'operation-4xx-response': 'warn' },
    doNotResolveExamples: true,
  },
  resolve: {
    http: { headers: [{ matches: '*', name: 'all', envVariable: 'all' }] },
  },
  theme: {
    openapi: {
      disableSidebar: true,
    },
  },
};

const flatTestConfig: FlatRawConfig = {
  apis: {
    'test@v1': {
      root: 'root.yaml',
      extends: ['recommended'],
      rules: { 'operation-2xx-response': 'error' },
    },
  },
  plugins: ['test-plugin'],
  extends: ['minimal'],
  rules: {
    'operation-4xx-response': 'warn',
  },
  resolve: {
    http: { headers: [{ matches: '*', name: 'all', envVariable: 'all' }] },
    doNotResolveExamples: true,
  },
  theme: {
    openapi: {
      disableSidebar: true,
    },
  },
};

describe('transformConfig', () => {
  it('should work for the `styleguide` syntax', () => {
    const transformedRawConfig: RawConfig = utils.transformConfig(
      makeTestRawConfig('styleguide', 'styleguide')
    );
    expect(transformedRawConfig).toMatchInlineSnapshot(`
      Object {
        "apis": Object {
          "test@v1": Object {
            "root": "root.yaml",
            "styleguide": Object {
              "rules": Object {
                "operation-2xx-response": "error",
              },
            },
          },
        },
        "styleguide": Object {
          "rules": Object {
            "operation-4xx-response": "warn",
          },
        },
        "theme": Object {
          "mockServer": Object {},
          "openapi": Object {},
        },
      }
    `);
  });
  it('should be equal for both `lint` and `styleguide` names', () => {
    expect(utils.transformConfig(makeTestRawConfig('lint', 'styleguide'))).toEqual(
      utils.transformConfig(makeTestRawConfig('styleguide', 'lint'))
    );
  });
  it('should work for `apiDefinitions`', () => {
    const testRawConfig = makeTestRawConfig('styleguide', 'lint');
    testRawConfig.apis = undefined;
    testRawConfig.apiDefinitions = { legacyApiDefinition: 'file.yaml' };
    expect(utils.transformConfig(testRawConfig)).toMatchInlineSnapshot(`
      Object {
        "apis": Object {
          "legacyApiDefinition": Object {
            "root": "file.yaml",
          },
        },
        "styleguide": Object {
          "rules": Object {
            "operation-4xx-response": "warn",
          },
        },
        "theme": Object {
          "mockServer": Object {},
          "openapi": Object {},
        },
      }
    `);
  });
  it('should throw an error if both `styleguide` and `lint` syntaxes used together', () => {
    const testRawConfig = makeTestRawConfig('styleguide', 'lint');
    testRawConfig.apiDefinitions = { legacyApiDefinition: 'file.yaml' };
    expect(() => utils.transformConfig(testRawConfig)).toThrowError(
      `Do not use 'apiDefinitions' field. Use 'apis' instead. `
    );
  });
  it('should transform flatten config into styleguide', () => {
    expect(utils.transformConfig(flatTestConfig)).toEqual({
      ...rawTestConfig,
      resolve: { ...rawTestConfig.resolve, doNotResolveExamples: true },
    });
  });
  it('should transform styleguide config into styleguide identically', () => {
    expect(utils.transformConfig(rawTestConfig)).toEqual(rawTestConfig);
  });
  it('should fail when there is a mixed config', () => {
    expect(() => utils.transformConfig({ ...rawTestConfig, extends: ['recommended'] })).toThrow(
      `Do not use 'lint', 'styleguide' and flat syntax together. \nSee more about the configuration in the docs: https://redocly.com/docs/cli/configuration/ \n`
    );
  });
  it('should throw an error if both `features.openapi` and `theme` syntaxes used together', () => {
    const testRawConfig: RawConfig & DeprecatedInRawConfig = {
      apis: {
        'test@v1': {
          root: 'root.yaml',
          styleguide: {
            extends: ['recommended'],
            rules: { 'operation-2xx-response': 'error' },
          },
        },
      },
      'features.openapi': {
        disableSidebar: true,
      },
      theme: {
        openapi: {
          disableSidebar: true,
        },
      },
    };
    expect(() => utils.transformConfig(testRawConfig)).toThrowError(
      `Do not use 'features.openapi' field. Use 'theme.openapi' instead. `
    );
  });
  it('should transform referenceDocs config into theme.openapi', () => {
    const testRawConfig: RawConfig & DeprecatedInRawConfig = {
      referenceDocs: {
        disableSidebar: true,
      },
    };
    expect(utils.transformConfig(testRawConfig)).toEqual({
      apis: undefined,
      styleguide: undefined,
      theme: { mockServer: {}, openapi: { disableSidebar: true } },
    });
  });
  it('should transform "features.openapi" config into theme.openapi', () => {
    const testRawConfig: RawConfig & DeprecatedInRawConfig = {
      'features.openapi': {
        disableSidebar: true,
      },
    };
    expect(utils.transformConfig(testRawConfig)).toEqual({
      apis: undefined,
      'features.openapi': {
        disableSidebar: true,
      },
      styleguide: undefined,
      theme: { mockServer: {}, openapi: { disableSidebar: true } },
    });
  });
});
