import { FormControl, FormGroup } from "@angular/forms";
import { StorageType } from "./lab-storage-type";


export type StorageFormGroup = FormGroup<{
    storageType: FormControl<StorageType>;
}>;