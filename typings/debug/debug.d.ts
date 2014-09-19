declare module "debug" {
  function debug(what:string):(msg:string, ...args:any[])=>void;

export = debug;
}