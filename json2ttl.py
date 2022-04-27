import json
from collections import namedtuple
from rdflib import Graph, Literal, Namespace, URIRef
from rdflib.namespace import DCTERMS, RDF, SKOS, XSD, NamespaceManager
from pathlib import Path
import os, sys

core = Namespace('https://w3id.org/iqb/mdc-core/cs_')
lrmi = Namespace('http://purl.org/dcx/lrmi-terms/')
oeh_md = Namespace('http://w3id.org/openeduhub/learning-resource-terms/')

if len(sys.argv) > 1 and str(sys.argv[1]) == "help":
    exit("Please add one input json file to the command line")

input_file =  "./" + sys.argv[1]

with open(input_file, 'r',  encoding='utf-8') as f:
    data = json.load(f)

output_folder = Path("./data")
if not output_folder.exists():
    output_folder.mkdir()

def buildGraph():
    g = Graph()
    base_url = URIRef("https://example.com/" + data['id'] + "/")
    g.add((base_url, RDF.type, SKOS.ConceptScheme))
    g.add((base_url, DCTERMS.creator, Literal("IQB - Institut zur Qualitätsentwicklung im Bildungswesen", lang="de")))
    g.add((base_url, DCTERMS.title, Literal(data['title'])))
    if "description" in data:
        g.add((base_url, DCTERMS.description, Literal(data['description'])))

    for dimension in data['dimensions']:
        concept_url = base_url + dimension['id']
        g.add(((concept_url, RDF.type, SKOS.Concept)))
        g.add((concept_url, SKOS.prefLabel, Literal(dimension['title'])))
        if "description" in dimension:
            g.add((concept_url, SKOS.definition, Literal(dimension['description'])))
        
        for c in dimension['children']:
            child_url = concept_url + '/' + c['id']
            g.add((concept_url, SKOS.topConceptOf, Literal(child_url)))
            g.add((child_url, RDF.type, SKOS.Concept))
            g.add((child_url, SKOS.prefLabel, Literal(c['title'])))
            g.add((child_url, SKOS.hasTopConcept, Literal(concept_url)))
            if "description" in c:
                g.add((child_url, SKOS.definition, Literal(c['description'])))
            
            if "children" in c:
                for cc in c['children']:
                    cc_url = child_url + "/" + cc['id']
                    g.add((child_url, SKOS.topConceptOf, Literal(cc_url)))
                    g.add((cc_url, RDF.type, SKOS.Concept))
                    g.add((cc_url, SKOS.hasTopConcept, Literal(child_url)))
                    g.add((cc_url, SKOS.prefLabel, Literal(cc['title'])))
                    if "description" in cc:
                        g.add((cc_url, SKOS.definition, Literal(cc['description'])))
                    
                    if "children" in cc:
                        for ccc in cc['children']:
                            ccc_url = cc_url + "/" + ccc['id']
                            g.add((cc_url, SKOS.topConceptOf, Literal(ccc_url)))
                            g.add((ccc_url, RDF.type, SKOS.Concept))
                            g.add((ccc_url, SKOS.hasTopConcept, Literal(cc_url)))
                            g.add((ccc_url, SKOS.prefLabel, Literal(ccc['title'])))
                            if "description" in ccc:
                                g.add((ccc_url, SKOS.definition, Literal(ccc['description'])))
                            
                            if "children" in ccc:
                                    for cccc in ccc['children']:
                                        cccc_url = ccc_url + "/" + cccc['id']
                                        g.add((ccc_url, SKOS.topConceptOf, Literal(cccc_url)))
                                        g.add((cccc_url, RDF.type, SKOS.Concept))
                                        g.add((cccc_url, SKOS.hasTopConcept, Literal(ccc_url)))
                                        g.add((cccc_url, SKOS.prefLabel, Literal(cccc['title'])))
                                        if "description" in cccc:
                                            g.add((cccc_url, SKOS.definition, Literal('description')))

    g.bind("skos", SKOS)
    g.bind("dct", DCTERMS)
    g.bind("core", core)

    outfile_path = output_folder / ("iqb_" + data['title'] + ".ttl")
    g.serialize(str(outfile_path), format="turtle", base=base_url, encoding="utf-8")

buildGraph()