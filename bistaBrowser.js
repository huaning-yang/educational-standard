let promptElement, pathElement, descriptionElement, detailsElement, svg, root,
	tree, i = 0, duration = 750, diagonal;

function loadData(dataKey) {
	console.log(dataKey);
	promptElement = document.getElementsByClassName("prompt")[0];
	promptElement.innerHTML = "Klicken Sie auf einen Knoten, um untere Strukturen einzublenden. Klicken Sie auf Text, um Erläuterungen anzuzeigen.";
	detailsElement = document.getElementsByClassName("details")[0];
	pathElement = document.getElementsByClassName("path")[0];
	descriptionElement = document.getElementsByClassName("description")[0];
	
	var margin = {top: 20, right: 120, bottom: 20, left: 120},
	width = 800 - margin.right - margin.left,
	height = 500 - margin.top - margin.bottom;

	tree = d3.layout.tree()
		.size([height, width]);

	diagonal = d3.svg.diagonal()
		.projection(function(d) { return [d.y, d.x]; });

	if (svg) {
		const d3hostElement = document.getElementById("d3host");
		while (d3hostElement.firstChild) {
			d3hostElement.removeChild(d3hostElement.lastChild);
		}		
	};
	svg = d3.select("#d3host").append("svg")
		.attr("width", width + margin.right + margin.left)
		.attr("height", height + margin.top + margin.bottom)
		.append("g")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	switch (dataKey) {
		case "dataMaSek1":
			root = dataMaSek1;
			break;
		case "dataMaPrimar":
			root = dataMaPrimar;
			break;
		case "dataDeSek1":
			root = dataDeSek1;
			break;
		case "dataDePrimar":
			root = dataDePrimar;
			break;
		case "dataEnFrSek1":
			root = dataEnFrSek1;
			break;
        case "dataBioSek1":
            root = dataBioSek1;
        case "dataCheSek1":
            root = dataCheSek1;
	}
	if (root.name) {
		resetData(root, 0)
	} else {
		transformTreeData(root, 0, "null");
	}
	root.x0 = height / 2;
	root.y0 = 0;
	if (root.children) {
		root.children.forEach(function(c) {
			if (c.children) {
				c._children = c.children;
				c.children = null;
			}
		});
	}

	update(root);

	d3.select(self.frameElement).style("height", "500px");
	showDescription(root);	
}

function resetData ( treeData, level ) {
	if (level > 1) {
		if (treeData.children) {
			treeData._children = treeData.children;
			treeData.children = null;
		};
		if (treeData._children) {
			treeData._children.forEach(function (c) {
				resetData(c, level + 1);
			});
		}
	} else {
		if (treeData.children) {
			treeData.children.forEach(function (c) {
				resetData(c, level + 1);
			});
		}
	}
}

function transformTreeData ( treeData, level, parentNode ) {
	treeData.parent = parentNode;
	if (level === 0) {
		treeData.name = "root";
		treeData.children = treeData.dimensions;
		treeData.children.forEach(function (c) {
			transformTreeData(c, level + 1, "root");
		})
	} else {
		treeData.name = (level === 1 ? "" : (parentNode + "-")) + treeData.id;
		if (treeData.children) {
			treeData.children.forEach(function (c) {
				transformTreeData(c, level + 1, treeData.name);
			});
			if (level === 1) {
				treeData._children = treeData.children;
				treeData.children = null;
			} else {
				treeData.__children = treeData.children;
				treeData.children = null;
			}
		};
	}
}

function update(source) {

    // Compute the new tree layout.
    var nodes = tree.nodes(root).reverse(),
    links = tree.links(nodes);

    // Normalize for fixed-depth.
    nodes.forEach(function (d) {
        d.y = d.depth * (d.children || d._children ? 240 : 170);
    });

    // Update the nodes…
    var node = svg.selectAll("g.node")
        .data(nodes, function (d) {
            return d.id || (d.id = ++i);
        });

    // Enter any new nodes at the parent's previous position.
    var nodeEnter = node.enter().append("g")
        .attr("class", "node")
        .attr("transform", function (d) {
            return "translate(" + source.y0 + "," + source.x0 + ")";
        });

    nodeEnter.append("circle")
    .attr("r", 1e-6)
    .style("fill", function (d) {
        return d._children ? "lightsteelblue" : "#fff";
    })
    .on("click", click);

    nodeEnter.append("text")
    .attr("x", function (d) {
        return d.children || d._children ? -13 : 13;
    })
    .attr("dy", ".35em")
    .attr("title", function (d) {
        return d.title
    })
    .attr("text-anchor", function (d) {
        return d.children || d._children ? "end" : "start";
    })
    .text(function (d) {
        return d.title;
    })
    .style("fill-opacity", 1e-6)
    .on("click", showDescription); ;

    // Transition nodes to their new position.
    var nodeUpdate = node.transition()
        .duration(duration)
        .attr("transform", function (d) {
            return "translate(" + d.y + "," + d.x + ")";
        });

    nodeUpdate.select("circle")
    .attr("r", 10)
    .style("fill", function (d) {
        return d._children ? "lightsteelblue" : "#fff";
    });

    nodeUpdate.select("text")
    .style("fill-opacity", 1);

    // Transition exiting nodes to the parent's new position.
    var nodeExit = node.exit().transition()
        .duration(duration)
        .attr("transform", function (d) {
            return "translate(" + source.y + "," + source.x + ")";
        })
        .remove();

    nodeExit.select("circle")
    .attr("r", 1e-6);

    nodeExit.select("text")
    .style("fill-opacity", 1e-6);

    // Update the links…
    var link = svg.selectAll("path.link")
        .data(links, function (d) {
            return d.target.id;
        });

    // Enter any new links at the parent's previous position.
    link.enter().insert("path", "g")
    .attr("class", "link")
    .attr("d", function (d) {
        var o = {
            x: source.x0,
            y: source.y0
        };
        return diagonal({
            source: o,
            target: o
        });
    });

    // Transition links to their new position.
    link.transition()
    .duration(duration)
    .attr("d", diagonal);

    // Transition exiting nodes to the parent's new position.
    link.exit().transition()
    .duration(duration)
    .attr("d", function (d) {
        var o = {
            x: source.x,
            y: source.y
        };
        return diagonal({
            source: o,
            target: o
        });
    })
    .remove();

    // Stash the old positions for transition.
    nodes.forEach(function (d) {
        d.x0 = d.x;
        d.y0 = d.y;
    });
}

// Toggle children on click.
function click(d) {
    if (d.name === "root") {
        resetdata(d, 0);
    } else {
        if (d.children) {
            d._children = d.children;
            d.children = null;
        } else {
            d.children = d._children;
            d._children = null;
        }
        const p = d.parent;
        p.children.forEach(function (c) {
            if (c.children && c.name !== d.name) {
                c._children = c.children;
                c.children = null;
            }
        });
    }
    update(d);
    showDescription(d);
}

function showDescription(node) {
    let description = node.description;
	while (detailsElement.firstChild) {
		detailsElement.removeChild(detailsElement.lastChild);
	}		
	if (node.__children) {
		const listAElement = document.createElement("ul");
        node.__children.forEach(function (c) {
			const listItemAElement = document.createElement("li");
			listItemAElement.innerHTML = c.title;
			listAElement.appendChild(listItemAElement);
			if (c.__children) {
				const listBElement = document.createElement("ul");
				c.__children.forEach(function (cc) {
					const listItemBElement = document.createElement("li");
					listItemBElement.innerHTML = cc.title;
					listBElement.appendChild(listItemBElement);
                    if(cc.__children) {
                        const listCElement = document.createElement("ul");
                        cc.__children.forEach( function (ccc) {
                            const listItemCElement = document.createElement("li");
                            listItemCElement.innerHTML = ccc.title;
                            listCElement.appendChild(listItemCElement);
                            if(ccc.__children) {
                                const listDElement = document.createElement("ul");
                                ccc.__children.forEach( function (cccc) {
                                    const listItemDElement = document.createElement("ul");
                                    listItemDElement.innerHTML = cccc.title;
                                    listDElement.appendChild(listItemDElement);
                                });
                                listCElement.appendChild(listDElement);
                            }
                        });
                        listBElement.appendChild(listCElement);
                    }
				});
				listAElement.appendChild(listBElement);
			}
		});
		detailsElement.appendChild(listAElement);
	}

    let path = "";
    do {
        path = " &rtri; " + node.title + path;
        node = node.parent;
    } while (node.parent !== undefined);

    descriptionElement.innerHTML = description || "";
    pathElement.innerHTML = path;
}
