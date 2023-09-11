from api.lab.plan.schemas import ExperimentalPlanPatch

patch_json = '''
{
                "title": "The importance of being earnest",
                "researcher": "hello@world.com",
                "researcherBaseCampus": {
                    "params": {
                        "code": "ROK",
                        "name": "Rockhampton"
                    },
                    "code": "ROK",
                    "name": "Rockhampton"
                },
                "researcherDiscipline": "ICT",
                "fundingModel": {
                    "id": "unknown2",
                    "description": "General research",
                    "requiresSupervisor": true
                },
                "supervisor": null,
                "processSummary": "Behave earnestly, then deceptively and observe changes."
}'''

ExperimentalPlanPatch.parse_raw(patch_json)
