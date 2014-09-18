declare module "debug" {
  function debug(what:string):(msg:string, ...args:string[])=>void;

export = debug;
}