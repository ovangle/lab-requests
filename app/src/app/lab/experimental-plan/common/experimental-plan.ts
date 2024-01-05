import { Model, ModelLookup, ModelMeta, ModelParams, ModelPatch, modelParamsFromJsonObject } from "src/app/common/model/model";
import { Discipline, disciplineFromJson } from "src/app/uni/discipline/discipline";
import { FundingModel, fundingModelFromJson } from "src/app/uni/research/funding/funding-model";
import { Injectable, inject } from "@angular/core";
import { HttpParams } from "@angular/common/http";
import { min as minDate, max as maxDate, parseISO } from "date-fns";
import { RestfulService, modelProviders } from "src/app/common/model/model-service";
import { ModelCollection, injectModelUpdate } from "src/app/common/model/model-collection";
import { defer } from "rxjs";
import { Campus, campusFromJson, CampusCode, isCampusCode } from "src/app/uni/campus/common/campus";
import { WorkUnit, WorkUnitCreate, workUnitFromJson } from "../../work-unit/common/work-unit";
import { ModelContext } from "src/app/common/model/context";
import { getFullFiscalYear } from "src/app/utils/date";
import { isJsonObject } from "src/app/utils/is-json-object";

export interface ExperimentalPlanParams extends ModelParams {
    researcher: string;
    researcherDiscipline: Discipline | null;
    researcherBaseCampus: Campus;

    title: string;
    fundingModel: FundingModel;

    supervisor: string | null;
    processSummary: string;

    workUnits: WorkUnit[];
}

export class ExperimentalPlan extends Model {
    researcher: string;
    researcherDiscipline: Discipline | null;
    researcherBaseCampus: Campus;

    title: string;
    fundingModel: FundingModel;

    supervisor: string | null;
    processSummary: string;

    workUnits: WorkUnit[];

    constructor(params: ExperimentalPlanParams) {
        super(params);
        this.title = params.title;
        this.researcher = params.researcher;
        this.researcherDiscipline = params.researcherDiscipline;
        this.researcherBaseCampus = params.researcherBaseCampus;

        this.fundingModel = params.fundingModel;
        this.supervisor = params.supervisor;

        this.processSummary = params.processSummary;

        this.workUnits = Array.from(params.workUnits);
    }

    get startDate(): Date | null {
        const startDates = this.workUnits.map(w => w.startDate);
        if (startDates.some(d => d == null)) {
            return null;
        }
        return minDate(startDates as Date[]);
    }

    get endDate(): Date | null {
        const endDates = this.workUnits.map(w => w.endDate);
        if (endDates.some(d => d == null)) {
            return null;
        }
        return maxDate(endDates as Date[]);
    }

    get projectFiscalYearRange(): Readonly<{ start: number; end: number; }> | null {
        if (this.startDate == null || this.endDate == null) {
            return null;
        }
        const end = this.endDate.getMonth() >= 7
            ? this.endDate.getFullYear() + 1
            : this.endDate.getFullYear();

        return {
            start: getFullFiscalYear(this.startDate),
            end: getFullFiscalYear(this.endDate)
        };
    }
}

function experimentalPlanParamsFromJson(json: unknown): ExperimentalPlanParams {
    if (!isJsonObject(json)) {
        throw new Error('Expected a json object');
    }

    const baseParams = modelParamsFromJsonObject(json);

    if (typeof json[ 'title' ] !== 'string') {
        throw new Error('Expected a \'title\'')
    }
    if (typeof json[ 'researcher' ] !== 'string') {
        throw new Error('Expected a \'researcher\'')
    }
    if (json[ 'supervisor' ] !== null && typeof json[ 'supervisor' ] !== 'string') {
        throw new Error('Expecteda a supervisor')
    }
    if (typeof json[ 'processSummary' ] !== 'string') {
        throw new Error('Expected a \'projectSummary\'')
    }

    if (!Array.isArray(json[ 'workUnits' ])) {
        throw new Error('Expected an array of work units')
    }

    return {
        ...baseParams,
        title: json[ 'title' ],
        researcher: json[ 'researcher' ],
        researcherDiscipline: disciplineFromJson(json[ 'researcherDiscipline' ]),
        researcherBaseCampus: campusFromJson(json[ 'researcherBaseCampus' ]),

        fundingModel: fundingModelFromJson(json[ 'fundingModel' ]),
        supervisor: json[ 'supervisor' ],

        processSummary: json[ 'processSummary' ],

        workUnits: Array.from(json[ 'workUnits' ]).map(workUnit => workUnitFromJson(workUnit))
    };
}

export function experimentalPlanFromJson(json: unknown): ExperimentalPlan {
    return new ExperimentalPlan(experimentalPlanParamsFromJson(json))
}

export interface ExperimentalPlanPatch extends ModelPatch<ExperimentalPlan> {
    title: string;
    researcher: string;
    researcherBaseCampus: Campus | CampusCode;
    researcherDiscipline: Discipline | null;

    fundingModel: FundingModel | string;
    supervisor: string | null;
    processSummary: string;

    addWorkUnits?: WorkUnitCreate[];
}

export function experimentalPlanPatchToJson(patch: ExperimentalPlanPatch): { [ k: string ]: unknown } {
    let researcherBaseCampus: string;
    if (patch.researcherBaseCampus instanceof Campus) {
        researcherBaseCampus = patch.researcherBaseCampus.id;
    } else if (isCampusCode(patch.researcherBaseCampus)) {
        researcherBaseCampus = patch.researcherBaseCampus;
    } else {
        throw new Error('Expected a campus or code');
    }

    return {
        title: patch.title,
        researcher: patch.researcher,
        researcherBaseCampus: researcherBaseCampus,
        researcherDiscipline: patch.researcherDiscipline,
        fundingModel: (patch.fundingModel instanceof FundingModel) ? patch.fundingModel.id : patch.fundingModel,
        supervisor: patch.supervisor,
        processSummary: patch.processSummary,
        addWorkUnits: patch.addWorkUnits || []
    }
}


export interface ExperimentalPlanLookup extends ModelLookup<ExperimentalPlan> {
    researcher?: string;
    supervisor?: string;
    technician?: string;
}
export function experimentalPlanLookupToHttpParams(lookup: Partial<ExperimentalPlanLookup>): HttpParams {
    return new HttpParams();
}

@Injectable({ providedIn: 'root' })
export class ExperimentalPlanMeta extends ModelMeta<
    ExperimentalPlan,
    ExperimentalPlanPatch,
    ExperimentalPlanLookup
> {
    override readonly model = ExperimentalPlan;
    override readonly modelParamsFromJson = experimentalPlanParamsFromJson;
    override readonly modelPatchToJson = experimentalPlanPatchToJson;
    override readonly lookupToHttpParams = experimentalPlanLookupToHttpParams;
}

@Injectable({ providedIn: 'root' })
export class ExperimentalPlanService extends RestfulService<ExperimentalPlan, ExperimentalPlanPatch, ExperimentalPlanLookup> {
    override readonly path = '/lab/experimental-plans'
    override readonly metadata = inject(ExperimentalPlanMeta);
}

@Injectable({ providedIn: 'root' })
export class ExperimentalPlanCollection extends ModelCollection<ExperimentalPlan, ExperimentalPlanPatch, ExperimentalPlanLookup> {
    override readonly service = inject(ExperimentalPlanService);
}

@Injectable()
export class ExperimentalPlanContext extends ModelContext<ExperimentalPlan, ExperimentalPlanPatch> {
    readonly plan$ = defer(() => this.committed$);
    readonly _doUpdate = injectModelUpdate(ExperimentalPlanService, ExperimentalPlanCollection);
}

export function labExperimentalPlanModelProviders() {
    return modelProviders(
        ExperimentalPlanMeta,
        ExperimentalPlanService
    )
}