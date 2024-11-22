export type DocumentSession = {
  id:             string;
  docName:        string;
  content:        string[];
  versionActive:  number;    
  versionCount:   number;
  unsavedChanges: boolean;
  paneSizes:      number[],
  screenshot:     string,
};