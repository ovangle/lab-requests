import { first, switchMap } from 'rxjs';
import urlJoin from 'url-join';
import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';

import {
  Model,
  ModelIndexPage,
  ModelQuery,
  ModelRef,
  ModelUpdateRequest,
  modelId,
  modelIndexPageFromJsonObject,
  modelRefFromJson,
  setModelQueryParams,
} from 'src/app/common/model/model';
import { JsonObject, isJsonObject } from 'src/app/utils/is-json-object';
import {
  ResearchFunding,
  ResearchFundingService,
} from '../funding/research-funding';
import { User, UserLookup } from 'src/app/user/user';
import {
  RestfulService,
} from 'src/app/common/model/model-service';

import { CreateResearchPlanTask, ResearchPlanTask, ResearchPlanTaskSlice, researchPlanTaskSliceToJson } from './task/research-plan-task';
import { Lab, LabService } from 'src/app/lab/lab';
import { Discipline, isDiscipline } from 'src/app/uni/discipline/discipline';
import { EquipmentLease } from 'src/app/equipment/lease/equipment-lease';
import { MaterialAllocation } from 'src/app/material/material-allocation';
import { SoftwareLease } from 'src/app/software/lease/software-lease';
import { isUUID } from 'src/app/utils/is-uuid';
import { LabAllocationConsumer } from 'src/app/lab/common/allocatable/lab-allocation-consumer';

export class ResearchPlanAttachment extends Model {
  readonly path: string;

  constructor(json: JsonObject) {
    super(json);
    if (typeof json['path'] !== 'string') {
      throw new Error("ResearchPlanAttachment: 'path' must be a string");
    }
    this.path = json['path'];
  }
}

export class ResearchPlan extends LabAllocationConsumer {
  title: string;
  description: string;
  discipline: Discipline;
  funding: ResearchFunding;

  researcher: User;
  coordinator: User;

  tasks: ModelIndexPage<ResearchPlanTask>;
  attachments: ModelIndexPage<ResearchPlanAttachment>;

  equipmentLeases: ModelIndexPage<EquipmentLease>;
  softwareLeases: ModelIndexPage<SoftwareLease>;
  inputMaterials: ModelIndexPage<MaterialAllocation>;
  outputMaterials: ModelIndexPage<MaterialAllocation>;

  constructor(json: JsonObject) {
    super(json);

    if (!isDiscipline(json['discipline'])) {
      throw new Error("Expected a discipline 'discipline'");
    }
    this.discipline = json['discipline'];

    if (typeof json['title'] !== 'string') {
      throw new Error("ResearchPlanParams: 'title' must be a string");
    }
    this.title = json['title'];
    if (typeof json['description'] !== 'string') {
      throw new Error("ResearchPlanParams: 'description' must be a string");
    }
    this.description = json['description'];
    if (!isJsonObject(json['funding'])) {
      throw new Error("ResearchPlanParams: 'funding' must be a json object");
    }
    this.funding = new ResearchFunding(json['funding']);

    if (!isJsonObject(json['researcher'])) {
      throw new Error("ResearchPlanParams: 'researcher' must be a json object");
    }
    this.researcher = new User(json['researcher']);

    if (!isJsonObject(json['coordinator'])) {
      throw new Error("ResearchPlanParams: 'coordinator' must be a json object");
    }
    this.coordinator = new User(json['coordinator']);

    if (!isJsonObject(json['tasks'])) {
      throw new Error("Expected a json object 'tasks'");
    }
    this.tasks = modelIndexPageFromJsonObject(ResearchPlanTask, json['tasks']);

    if (!isJsonObject(json['attachments'])) {
      throw new Error("Expected a json object 'attachments'");
    }
    this.attachments = modelIndexPageFromJsonObject(ResearchPlanAttachment, json['attachments']);

    if (!isJsonObject(json['equimentLeases'])) {
      throw new Error("Expected a json object 'equimentLeases'");
    }
    this.equipmentLeases = modelIndexPageFromJsonObject(EquipmentLease, json['equimentLeases']);

    if (!isJsonObject(json['softwareLeases'])) {
      throw new Error("Expected a json object 'softwareLeases'");
    }
    this.softwareLeases = modelIndexPageFromJsonObject(SoftwareLease, json['softwareLeases']);
    if (!isJsonObject(json['inputMaterials'])) {
      throw new Error("Expected a json object 'inputMaterials'");
    }
    this.inputMaterials = modelIndexPageFromJsonObject(MaterialAllocation, json['inputMaterials']);

    if (!isJsonObject(json['outputMaterials'])) {
      throw new Error("Expected a json object 'outputMaterials'");
    }
    this.outputMaterials = modelIndexPageFromJsonObject(MaterialAllocation, json['outputMaterials']);
  }

  resolveLab(labService: LabService): Promise<Lab> {
    throw new Error('Method not implemented.');
  }
  resolveResearchFunding(service: ResearchFundingService): Promise<ResearchFunding> {
    throw new Error('Method not implemented.');
  }

  getAllocationPage(allocationType: string) {
    switch (allocationType) {
      case 'equipment_lease':
        return this.equipmentLeases;
      case 'software_lease':
        return this.softwareLeases;
      case 'input_material':
        return this.inputMaterials;
      case 'output_material':
        return this.outputMaterials;
      default:
        throw new Error(`Unrecognised allocation type for research plan ${allocationType}`);
    }
  }
}

export interface CreateResearchPlan {
  title: string;
  description: string;
  funding: string | null;
  researcher: string;
  coordinator: string;
  tasks: CreateResearchPlanTask[];
}

function createResearchPlanToJsonObject(plan: CreateResearchPlan) {
  return { ...plan };
}

export interface UpdateResearchPlan extends ModelUpdateRequest<ResearchPlan> {
  title: string;
  description: string;
  funding: ResearchFunding | null;
  tasks?: ResearchPlanTaskSlice[];
}

function updateResearchPlanToJsonObject(patch: Partial<UpdateResearchPlan>) {
  return {
    title: patch.title,
    description: patch.description,
    funding: patch.funding ? modelId(patch.funding) : undefined,
    tasks: Array.isArray(patch.tasks) ? patch.tasks.map(t => researchPlanTaskSliceToJson(t)) : undefined,
  };
}

export interface ResearchPlanQuery extends ModelQuery<ResearchPlan> {
  supervisor?: ModelRef<User>;
  technician?: ModelRef<User>;
  researcher?: ModelRef<User>;
}

function setResearchPlanQueryParams(params: HttpParams, query: Partial<ResearchPlanQuery>): HttpParams {
  params = setModelQueryParams(params, query);

  if (query.supervisor) {
    params = params.set('supervisor', modelId(query.supervisor));
  }
  if (query.technician) {
    params = params.set('technician', modelId(query.technician));
  }
  if (query.researcher) {
    params = params.set('researcher', modelId(query.researcher));
  }

  return params;
}


@Injectable({ providedIn: 'root' })
export class ResearchPlanService extends RestfulService<ResearchPlan, ResearchPlanQuery> {
  override path = '/research/plans';
  override readonly model = ResearchPlan;
  override readonly setModelQueryParams = setResearchPlanQueryParams;

  create(request: CreateResearchPlan) {
    return this._doCreate(
      createResearchPlanToJsonObject,
      request
    );
  }

  update(plan: ResearchPlan, request: Partial<UpdateResearchPlan>) {
    return this._doUpdate(
      plan,
      (request) => updateResearchPlanToJsonObject(request),
      request
    )
  }

  _alterTasks(task: ResearchPlanTask, slices: ResearchPlanTaskSlice[]) {
    return this.fetch(task.planId).pipe(
      switchMap(plan => this.update(plan, {
        title: plan.title,
        description: plan.description,
        tasks: slices,
        funding: plan.funding,
      }))
    );
  }

  updateTask(task: ResearchPlanTask, request: CreateResearchPlanTask) {
    const slice: ResearchPlanTaskSlice = {
      startIndex: task.index,
      endIndex: task.index + 1,
      items: [
        request
      ]
    };
    return this._alterTasks(task, [slice]);
  }

  removeTask(task: ResearchPlanTask) {
    const slice: ResearchPlanTaskSlice = {
      startIndex: task.index,
      endIndex: task.index + 1,
      items: []
    };
    return this._alterTasks(task, [slice]);
  }

  _resourceIndexUrl$(plan: ResearchPlan, resourceType: string) {
    return this.modelUrl(plan).pipe(
      first(),
      switchMap(modelUrl => urlJoin(modelUrl, resourceType) + '/')
    )
  }
}
