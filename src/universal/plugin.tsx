import React from 'react';
import {
  ILowCodePluginContext,
  plugins,
  skeleton,
  project,
  setters,
} from '@alilc/lowcode-engine';
import AliLowCodeEngineExt from '@alilc/lowcode-engine-ext';
import { Button } from '@alifd/next';
import UndoRedoPlugin from '@alilc/lowcode-plugin-undo-redo';
import ComponentsPane from '@alilc/lowcode-plugin-components-pane';
import ZhEnPlugin from '@alilc/lowcode-plugin-zh-en';
import CodeGenPlugin from '@alilc/lowcode-plugin-code-generator';
import DataSourcePanePlugin from '@alilc/lowcode-plugin-datasource-pane';
import SchemaPlugin from '@alilc/lowcode-plugin-schema';
import CodeEditor from "@alilc/lowcode-plugin-code-editor";
import ManualPlugin from "@alilc/lowcode-plugin-manual";
import Inject, { injectAssets } from '@alilc/lowcode-plugin-inject';
import SimulatorResizer from '@alilc/lowcode-plugin-simulator-select';

// 注册到引擎
import TitleSetter from '@alilc/lowcode-setter-title';
import BehaviorSetter from '../setters/behavior-setter';
import CustomSetter from '../setters/custom-setter';
import Logo from '../sample-plugins/logo';
import { deleteHiddenTransducer } from '../sample-plugins/delete-hidden-transducer';

import {
  loadIncrementalAssets,
  getPageSchema,
  saveSchema,
  resetSchema,
  preview,
} from './utils';
import assets from './assets.json'
import { registerRefProp } from 'src/sample-plugins/set-ref-prop';

export default async function registerPlugins() {
  await plugins.register(ManualPlugin);

  await plugins.register(Inject);

  await plugins.register(registerRefProp);

  await plugins.register(deleteHiddenTransducer);


  /**
   * 顶部区域
   */
  // 注册logo
  const logoPlugin = (ctx: ILowCodePluginContext) => {
    return {
      name: 'logo-plugin',
      async init() {
        const { skeleton } = ctx;
        // 注册 logo 面板
        skeleton.add({
          area: 'topArea',
          type: 'Widget',
          name: 'logo',
          content: Logo,
          contentProps: {
            logo: 'https://img.alicdn.com/imgextra/i4/O1CN013w2bmQ25WAIha4Hx9_!!6000000007533-55-tps-137-26.svg',
            href: 'https://lowcode-engine.cn',
          },
          props: {
            align: 'left',
          },
        });
      },
    };
  }
  logoPlugin.pluginName = 'logoPlugin';
  await plugins.register(logoPlugin);

  // 注册回退/前进
  await plugins.register(UndoRedoPlugin);

  // 注册异步加载资源
  const loadAssetsSample = (ctx: ILowCodePluginContext) => {
    return {
      name: 'loadAssetsSample',
      async init() {
        const { skeleton } = ctx;

        skeleton.add({
          name: 'loadAssetsSample',
          area: 'topArea',
          type: 'Widget',
          props: {
            align: 'right',
            width: 80,
          },
          content: (
            <Button onClick={loadIncrementalAssets}>
              异步加载资源
            </Button>
          ),
        });
      },
    };
  };
  loadAssetsSample.pluginName = 'loadAssetsSample';
  await plugins.register(loadAssetsSample);

  // 注册保存、重置面板
  const saveSample = (ctx: ILowCodePluginContext) => {
    return {
      name: 'saveSample',
      async init() {
        const { skeleton, hotkey } = ctx;

        skeleton.add({
          name: 'saveSample',
          area: 'topArea',
          type: 'Widget',
          props: {
            align: 'right',
          },
          content: (
            <Button onClick={() => saveSchema()}>
              保存到本地
            </Button>
          ),
        });
        skeleton.add({
          name: 'resetSchema',
          area: 'topArea',
          type: 'Widget',
          props: {
            align: 'right',
          },
          content: (
            <Button onClick={() => resetSchema()}>
              重置页面
            </Button>
          ),
        });
        hotkey.bind('command+s', (e) => {
          e.preventDefault();
          saveSchema();
        });
      },
    };
  }
  saveSample.pluginName = 'saveSample';
  await plugins.register(saveSample);

  // 注册出码插件
  CodeGenPlugin.pluginName = 'CodeGenPlugin';
  await plugins.register(CodeGenPlugin);

  // 注册预览插件
  const previewSample = (ctx: ILowCodePluginContext) => {
    return {
      name: 'previewSample',
      async init() {
        const { skeleton } = ctx;
        skeleton.add({
          name: 'previewSample',
          area: 'topArea',
          type: 'Widget',
          props: {
            align: 'right',
          },
          content: (
            <Button type="primary" onClick={() => preview()}>
              预览
            </Button>
          ),
        });
      },
    };
  };
  previewSample.pluginName = 'previewSample';
  await plugins.register(previewSample);
 

  /**
   * 左侧plugin区域
   * */ 

  // 注册组件面板
  const ComponentsPlugin = (ctx: ILowCodePluginContext) => {
    return {
      name: 'components-panel',
      async init() {
        const { skeleton } = ctx;
        const componentsPane = skeleton.add({
          area: 'leftArea',
          type: 'PanelDock',
          name: 'componentsPane',
          content: ComponentsPane,
          contentProps: {},
          props: {
            align: 'top',
            icon: 'zujianku',
            description: '组件库',
          },
        });
        componentsPane?.disable?.();
        project.onSimulatorRendererReady(() => {
          componentsPane?.enable?.();
        })
      },
    };
  }
  ComponentsPlugin.pluginName = 'ComponentsPane';
  await plugins.register(ComponentsPlugin);

  // 注册数据源面板
  DataSourcePanePlugin.pluginName = 'DataSourcePane';
  await plugins.register(DataSourcePanePlugin);

  // 注册js编辑面板
  CodeEditor.pluginName = 'CodeEditor';
  await plugins.register(CodeEditor);

  // plugin API 见 https://lowcode-engine.cn/docV2/ibh9fh
  // 注册schema面板
  SchemaPlugin.pluginName = 'SchemaPlugin';
  await plugins.register(SchemaPlugin);

  // TODO 这个不知道注册什么功能
  SimulatorResizer.pluginName = 'SimulatorResizer';
  plugins.register(SimulatorResizer);

  // 注册中英文切换
  await plugins.register(ZhEnPlugin);

  // 初始化画布 & 注册资产包(assets + schema)
  const editorInit = (ctx: ILowCodePluginContext) => {
    return {
      name: 'editor-init',
      async init() {
        // 修改面包屑组件的分隔符属性setter
        // const assets = await (
        //   await fetch(
        //     `https://alifd.alicdn.com/npm/@alilc/lowcode-materials/build/lowcode/assets-prod.json`
        //   )
        // ).json();
        // 设置物料描述
        const { material, project } = ctx;

        await material.setAssets(await injectAssets(assets));

        const schema = await getPageSchema();

        // 加载 schema
        project.openDocument(schema);
      },
    };
  }
  editorInit.pluginName = 'editorInit';
  await plugins.register(editorInit);

  // 设置内置 setter 和事件绑定、插件绑定面板
  const setterRegistry = (ctx: ILowCodePluginContext) => {
    const { setterMap, pluginMap } = AliLowCodeEngineExt;
    return {
      name: 'ext-setters-registry',
      async init() {
        const { setters, skeleton } = ctx;
        // 注册setterMap
        setters.registerSetter(setterMap);
        // 注册插件
        // 注册事件绑定面板
        skeleton.add({
          area: 'centerArea',
          type: 'Widget',
          content: pluginMap.EventBindDialog,
          name: 'eventBindDialog',
          props: {},
        });

        // 注册变量绑定面板
        skeleton.add({
          area: 'centerArea',
          type: 'Widget',
          content: pluginMap.VariableBindDialog,
          name: 'variableBindDialog',
          props: {},
        });
      },
    };
  }
  setterRegistry.pluginName = 'setterRegistry';
  await plugins.register(setterRegistry);

  // TODO 
  const customSetter = (ctx: ILowCodePluginContext) => {
    return {
      name: '___registerCustomSetter___',
      async init() {
        const { setters } = ctx;

        setters.registerSetter('TitleSetter', TitleSetter);
        setters.registerSetter('BehaviorSetter', BehaviorSetter);
        setters.registerSetter('CustomSetter', CustomSetter);
      },
    };
  }
  customSetter.pluginName = 'customSetter';
  await plugins.register(customSetter);
};
