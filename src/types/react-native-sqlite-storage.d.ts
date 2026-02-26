declare module 'react-native-sqlite-storage' {
  export namespace SQLite {
    export type SQLiteDatabase = any;
  }

  const SQLite: {
    enablePromise(enabled: boolean): void;
    openDatabase(opts: any): Promise<any> | any;
    [key: string]: any;
  };

  export default SQLite;
}
