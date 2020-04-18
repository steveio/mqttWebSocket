'use strict'; //Translate to class to have seperate variables.

function _instanceof(left, right) { if (right != null && typeof Symbol !== "undefined" && right[Symbol.hasInstance]) { return right[Symbol.hasInstance](left); } else { return left instanceof right; } }

function _classCallCheck(instance, Constructor) { if (!_instanceof(instance, Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var CustomGauge =
    /*#__PURE__*/
    function () {
        function CustomGauge(container, gaugeData) {
            _classCallCheck(this, CustomGauge);

            _defineProperty(this, "renderRangeText", function (g) {
                var self = this.rangeTextStyleCal;
                g.append('text').attr('dy', '5%').append('textPath').attr('xlink:href', function (d) {
                    return '#' + d[3];
                }).text(function (d) {
                    return d[4];
                }).attr('startOffset', '25%').attr('text-anchor', 'middle').style('font-size', function (d) {
                    return self(d);
                });
            });

            _defineProperty(this, "rangeTextStyleCal", function (d) {
                var largeTxtBool = true;

                if (d[4] != null && d[4].length > 0) {
                    largeTxtBool = d[4].length + 5 >= d[1] - d[0];
                }

                return largeTxtBool ? "65%" : "100%";
            });

            this.view = {
                width: 300,
                height: 225
            };
            this.gaugeAngle = parseInt(gaugeData.angle) || 120;
            this.innerRadius = Math.round(this.view.width * 130 / 300);
            this.outerRadius = Math.round(this.view.width * 145 / 300);
            this.majorGradPrecision = gaugeData.majorGradPrecision || 1;
            this.majorGrads = parseInt(gaugeData.majorGrads - 1) || 5;
            this.minorGrads = parseInt(gaugeData.minorGrads) || 10;
            this.majorGradLength = Math.round(this.view.width * 16 / 300);
            this.majorGradMarginTop = Math.round(this.view.width * 7 / 300);
            this.majorGradColour = gaugeData.majorGradColour || '#B0B0B0';
            this.minorGradColour = gaugeData.minorGradColour || '#D0D0D0';
            this.majorGradTxtColour = gaugeData.majorGradTextColour || '#6C6C6C';
            this.valueUnit = gaugeData.valueUnit || '';
            this.gaugeTitle = gaugeData.gaugeTitle || 'A gauge';
            this.valueVerticalOffSet = Math.round(this.view.width * 35 / 300);
            this.lowerLimit = gaugeData.lowerLimit;
            this.upperLimit = gaugeData.upperLimit;
            this.inActiveColour = '#D7D7D7';
            this.transMs = parseInt(gaugeData.transMs) || 750;
            this.majorGradTextSize = parseInt(gaugeData.majorGradTextSize);
            this.needles = gaugeData.needles;
            this.ranges = gaugeData.ranges;
            this.elem = container;
            this.height = container.height();
            this.svg = this.renderSvg();
        }

        _createClass(CustomGauge, [{
            key: "initialise",
            value: function initialise() {
                var d3DataSource = [];
                var translateNum = this.view.width / 2;
                var translate = this.transAttr(translateNum, translateNum);
                this.svg.selectAll('*').remove();
                d3DataSource = this.ranges.map(function (range) {
                    return [range.min, range.max, range.color, range.id, range.value];
                });
                var cScale = d3.scaleLinear().domain([this.lowerLimit, this.upperLimit]).range([-1 * this.gaugeAngle * (Math.PI / 180), this.gaugeAngle * (Math.PI / 180)]);
                var arc = d3.arc().innerRadius(this.innerRadius).outerRadius(this.outerRadius).startAngle(function (d) {
                    return cScale(d[0]);
                }).endAngle(function (d) {
                    return cScale(d[1]);
                });
                var g = this.svg.selectAll('path').data(d3DataSource).enter().append('g');
                g.append('path').attr('d', arc).attr('transform', translate).attr('style', function (d) {
                    return 'fill:' + d[2];
                }).attr('id', function (d) {
                    return d[3];
                    });
                this.renderSvgGaugeDesc();
                this.renderRangeText(g);
                var majorGradsAngles = this.getMajorGradAngles();
                var majorGradValues = this.getMajorGradValues();
                this.renderMajorGrads(majorGradsAngles);
                this.renderMajorGradTexts(majorGradsAngles, majorGradValues, this.valueUnit);
                this.renderGradNeedles(this.needles);
                this.renderSvgDimensions(this.view, this.height);
            }
        }, {
            key: "onNeedlesChanged",
            value: function onNeedlesChanged(needles) {
                var needleAngle = 0;

                if (needles != null && needles.length > 0) {
                    for (var i = 0; i < needles.length; i++) {
                        $('#' + this.needles[i].id + '.mtt-graduationValueText').text('[ ' + [needles[i].value.toFixed(needles[i].precision), needles[i].valueUnit].join(" ") + ' ]');

                        if (needles[i].value >= this.lowerLimit && needles[i].value <= this.upperLimit) {
                            needleAngle = this.getNewAngle(needles[i].value);
                            this.gaugeRotateNeedle($('#' + this.needles[i].id + '.mtt-graduation-needle path'), needleAngle, this.transMs);
                        } else {
                            //not sure what to do here ...
                            $('#' + this.needles[i].id + '.mtt-graduation-needle').css("visibility", "hidden");
                            $('#' + this.needles[i].id + '.mtt-graduation-needle-center').attr("fill", this.inActiveColour);
                        }
                    }
                }
            } // *** GAUGE RENDERS START **

        }, {
            key: "renderSvg",
            value: function renderSvg() {
                var svg = $(this.elem[0]).children('svg');

                if (svg != null && svg.length > 0) {
                    return d3.select(svg[0]);
                } else {
                    return d3.select(this.elem[0]).append('svg');
                }

            }
        }, {
            key: "renderSvgDimensions",
            value: function renderSvgDimensions(view, height) {
                d3.select(this.elem[0]).select('svg').attr('width', '100%').attr('height', height).attr('viewBox', '0 0 ' + view.width + ' ' + view.height);
            }
        }, {
            key: "renderGradNeedles",
            value: function renderGradNeedles(needles) {
                if (needles && needles.length > 0) {
                    for (var i = 0; i < needles.length; i++) {
                        needles[i].index = i;
                        this.renderGradNeedle(needles[i]);
                    }
                }
            }
        }, {
            key: "renderGradNeedle",
            value: function renderGradNeedle(needleObj) {
                if (needleObj !== null && needleObj !== undefined) {
                    this.removeAllNeedle(this.svg, needleObj);
                    needleObj = this.needleObjDimUpdate(needleObj);

                    if (typeof needleObj.value === 'undefined') {
                        needleObj.color = this.inActiveColour;
                    } else {
                        //not sure about this ... might be needed or change if multiple.
                        var textSize = isNaN(needleObj.textSize) ? this.view.width * 12 / 300 : needleObj.textSize;
                        var fontStyle = textSize + "px";
                        var lineData = [[needleObj.needleRadius, 0], [0, -needleObj.needleLen], [-needleObj.needleRadius, 0], [needleObj.needleRadius, 0]];
                        var pointerLine = d3.line().curve(d3.curveMonotoneX);
                        var pg = this.svg.append('g').data([lineData])
                            .attr('class', ["mtt-graduation-needle", needleObj.id].join(" "))
                            .attr('id', needleObj.id)
                            .style("fill", needleObj.color)
                            .style("cursor", needleObj.clickFunc != null && needleObj.clickFunc.length > 0 ? "pointer" : "default")
                            .attr('transform', 'translate(' + needleObj.centerX + ',' + needleObj.centerY + ')')
                            .attr('data-func', needleObj.clickFunc)
                            .attr('data-funcparams', needleObj.clickParams);
                        pg.append('path')
                            .attr('d', pointerLine)
                            .attr('transform', 'rotate(' + needleObj.needleAngle + ')')
                            .attr('style', 'transition-duration: 5s;')
                            .append('title').text('[ ' + [needleObj.value.toFixed(needleObj.precision), needleObj.valueUnit].join(" ") + ' ]'); //not sure about this
                        //needle = pg.append('path')
                        //    .attr('d', pointerLine)
                        //    .attr('transform', 'rotate(' + needleObj.needleAngle + ')')
                        //    .attr('style', 'transition-duration: 5s;');
                        //For Text Purpose Only.

                        this.renderValueContent(this.svg, needleObj, fontStyle);
                    } //circles building.


                    this.renderNeedleCircle(this.svg, needleObj);
                    this.renderNeedleHollowCircle(this.svg, needleObj);

                    if (needleObj.value < needleObj.minLimit || needleObj.value > needleObj.maxLimit) {
                        this.svg.selectAll([".mtt-graduation-needle", needleObj.id].join(" ")).style("visibility", "hidden");
                        this.svg.selectAll([".mtt-graduation-needle-center", needleObj.id].join(" ")).attr("fill", this.inActiveColour);
                    }
                }
            }
        }, {
            key: "renderNeedleHollowCircle",
            value: function renderNeedleHollowCircle(svg, needleObj) {
                svg.append("circle").attr("r", needleObj.circleRadius / 2).attr("cy", needleObj.centerX).attr("cx", needleObj.centerY).attr("fill", "none").attr("stroke-width", "0.4").attr("stroke", "#D3D3D3").attr("class", ["mtt-graduation-needle-center", needleObj.id].join(" "));
            }
        }, {
            key: "renderNeedleCircle",
            value: function renderNeedleCircle(svg, needleObj) {
                svg.append("circle").attr("r", needleObj.circleRadius).attr("cy", needleObj.centerX).attr("cx", needleObj.centerY).attr("fill", needleObj.color).attr("class", ["mtt-graduation-needle-center", needleObj.id].join(" "));
            }
        }, {
            key: "renderValueContent",
            value: function renderValueContent(svg, needleObj, fontStyle) {
                var valueUnitFull = needleObj.valueUnit;

                if (needleObj.valueUnit != null && needleObj.valueUnit.length > 0) {
                    if (needleObj.valueUnit.length > 4) {
                        needleObj.valueUnit = needleObj.valueUnit.slice(0, 4);
                    }
                }

                svg.append("text").attr("x", needleObj.centerX)
                    .attr("y", needleObj.centerY + this.valueVerticalOffSet + (needleObj.index > 0 ? needleObj.index * 12 : 0))
                    .attr("class", "mtt-graduationValueText")
                    .attr("id", needleObj.id)
                    .attr("fill", needleObj.color)
                    .attr("text-anchor", "middle")
                    .attr('data-func', needleObj.clickFunc)
                    .attr('data-funcparams', needleObj.clickParams)
                    .style("font", fontStyle)
                    .style("cursor", needleObj.clickFunc != null && needleObj.clickFunc.length > 0 ? "pointer" : "default")
                    .text('[ ' + [needleObj.value.toFixed(needleObj.precision), needleObj.valueUnit].join(" ") + ' ]').append('title').text([needleObj.value.toFixed(needleObj.precision), valueUnitFull].join(" "));
            }
        }, {
            key: "renderMajorGradTexts",
            value: function renderMajorGradTexts(majorGradsAngles, majorGradValues, valueUnit) {
                if (!this.ranges) return;
                this.removeGradText(this.svg);
                var centerX = this.view.width / 2;
                var centerY = this.view.width / 2;
                var textVerticalPadding = 5;
                var textHorizontalPadding = 5;
                var lastGraduationValue = majorGradValues[majorGradValues.length - 1];
                var textSize = isNaN(this.majorGradTextSize) ? this.view.width * 12 / 300 : this.majorGradTextSize;
                var fontStyle = textSize + "px";
                var dummyText = this.svg.append("text").attr("x", centerX).attr("y", centerY).attr("fill", "transparent").attr("text-anchor", "middle").style("font", fontStyle).text(lastGraduationValue);
                var textWidth = dummyText.node().getBBox().width;

                for (var i = 0; i < majorGradsAngles.length; i++) {
                    var angle = majorGradsAngles[i];
                    var cos1Adj = Math.round(Math.cos((90 - angle) * Math.PI / 180) * (this.innerRadius - this.majorGradMarginTop - this.majorGradLength - textHorizontalPadding));
                    var sin1Adj = Math.round(Math.sin((90 - angle) * Math.PI / 180) * (this.innerRadius - this.majorGradMarginTop - this.majorGradLength - textVerticalPadding));
                    var sin1Factor = 1;
                    if (sin1Adj < 0) sin1Factor = 1.1;
                    if (sin1Adj > 0) sin1Factor = 0.9;

                    if (cos1Adj > 0) {
                        if (angle > 0 && angle < 45) {
                            cos1Adj -= textWidth / 2;
                        } else {
                            cos1Adj -= textWidth;
                        }
                    }

                    if (cos1Adj < 0) {
                        if (angle < 0 && angle > -45) {
                            cos1Adj -= textWidth / 2;
                        }
                    }

                    if (cos1Adj == 0) {
                        cos1Adj -= angle == 0 ? textWidth / 4 : textWidth / 2;
                    }

                    var x1 = centerX + cos1Adj;
                    var y1 = centerY + sin1Adj * sin1Factor * -1;
                    this.svg.append("text").attr("class", "mtt-majorGraduationText").style("font", fontStyle).attr("text-align", "center").attr("x", x1).attr("dy", y1).attr("fill", this.majorGradTxtColour).text(majorGradValues[i] + valueUnit);
                }
            }
        }, {
            key: "renderMajorGrads",
            value: function renderMajorGrads(majorGradsAngles) {
                var centerX = this.view.width / 2;
                var centerY = this.view.width / 2;

                for (var i = 0; i < majorGradsAngles.length; i++) {
                    var cos1Adj = Math.round(Math.cos((90 - majorGradsAngles[i]) * Math.PI / 180) * (this.innerRadius - this.majorGradMarginTop - this.majorGradLength));
                    var sin1Adj = Math.round(Math.sin((90 - majorGradsAngles[i]) * Math.PI / 180) * (this.innerRadius - this.majorGradMarginTop - this.majorGradLength));
                    var cos2Adj = Math.round(Math.cos((90 - majorGradsAngles[i]) * Math.PI / 180) * (this.innerRadius - this.majorGradMarginTop));
                    var sin2Adj = Math.round(Math.sin((90 - majorGradsAngles[i]) * Math.PI / 180) * (this.innerRadius - this.majorGradMarginTop));
                    var x1 = centerX + cos1Adj;
                    var y1 = centerY + sin1Adj * -1;
                    var x2 = centerX + cos2Adj;
                    var y2 = centerY + sin2Adj * -1;
                    this.svg.append('svg:line').attr('x1', x1).attr('y1', y1).attr('x2', x2).attr('y2', y2).style('stroke', this.majorGradColour);
                    this.renderMinorGrads(majorGradsAngles, i);
                }
            }
        }, {
            key: "renderMinorGrads",
            value: function renderMinorGrads(majorGradsAngles, indexMajor) {
                var minorGradAngles = [];

                if (indexMajor > 0) {
                    var minScale = majorGradsAngles[indexMajor - 1];
                    var maxScale = majorGradsAngles[indexMajor];
                    var scaleRange = maxScale - minScale;
                    var minorGrads = this.minorGrads;

                    for (var i = 1; i < minorGrads; i++) {
                        var scaleValue = minScale + i * scaleRange / minorGrads;
                        minorGradAngles.push(scaleValue);
                    }

                    var centerX = this.view.width / 2;
                    var centerY = this.view.width / 2;

                    for (var x = 0; x < minorGradAngles.length; x++) {
                        var cos1Adj = Math.round(Math.cos((90 - minorGradAngles[x]) * Math.PI / 180) * (this.innerRadius - this.majorGradMarginTop - this.majorGradLength));
                        var sin1Adj = Math.round(Math.sin((90 - minorGradAngles[x]) * Math.PI / 180) * (this.innerRadius - this.majorGradMarginTop - this.majorGradLength));
                        var cos2Adj = Math.round(Math.cos((90 - minorGradAngles[x]) * Math.PI / 180) * (this.innerRadius - this.majorGradMarginTop));
                        var sin2Adj = Math.round(Math.sin((90 - minorGradAngles[x]) * Math.PI / 180) * (this.innerRadius - this.majorGradMarginTop));
                        var x1 = centerX + cos1Adj;
                        var y1 = centerY + sin1Adj * -1;
                        var x2 = centerX + cos2Adj;
                        var y2 = centerY + sin2Adj * -1;
                        this.svg.append('svg:line').attr('x1', x1).attr('y1', y1).attr('x2', x2).attr('y2', y2).style('stroke', this.minorGradColour);
                    }
                }
            }

            }, {
                key: "renderSvgGaugeDesc",
                value: function renderSvgGaugeDesc() {
                    //For Accessibility Purposes.
                    var titleElem = this.svg.append('title');
                    var descElem = this.svg.append('desc');
                    var descText = [];
                    descText.push(
                        "The gauge ranges from " + this.lowerLimit + " to " + this.upperLimit + " with the unit of " + this.valueUnit + ".",
                        " Having " + this.ranges.length + " of ranges and " + this.needles.length + " needles. "
                    );

                    for (var i = 0; i < this.ranges.length; i++) {
                        if (i === 0) {
                            descText.push(
                                "The first range being from " + this.ranges[i].min + " to upper limit of " + this.ranges[i].max + ". "
                            );
                        } else {
                            if (i !== this.ranges.length - 1) {
                                //middle
                                descText.push(
                                    "The next range being from " + this.ranges[i].min + " to upper limit of " + this.ranges[i].max + ". "
                                );
                            } else {
                                //end
                                descText.push(
                                    "The last range being from " + this.ranges[i].min + " to upper limit of " + this.ranges[i].max + ". "
                                );
                            }
                        }

                    }
                    for (var i = 0; i < this.needles.length; i++) {
                        if (i === 0) {
                            descText.push(
                                "The first needle being a value of " + this.needles[i].value + " and unit of " + this.needles[i].valueUnit + ". "
                            );
                        } else {
                            if (i !== this.ranges.length - 1) {
                                //middle
                                descText.push(
                                    "The next needle being a value of " + this.needles[i].value + " and unit of " + this.needles[i].valueUnit + ". "
                                );
                            } else {
                                //end
                                descText.push(
                                    "The last needle being a value of " + this.needles[i].value + " and unit of " + this.needles[i].valueUnit + ". "
                                );
                            }
                        }
                    }
                    //Need the design form title.
                    titleElem.text(this.gaugeTitle);
                    descElem.text(descText.join(""));

                }
            },
        // *** GAUGE RENDERS END **
        // ** HELPERS && CALCULATORS START **
        {
            key: "gaugeRotateNeedle",
            value: function gaugeRotateNeedle(elem, degree, speed) {
                elem.css({
                    '-webkit-transform': 'rotate(' + degree + 'deg)',
                    '-moz-transform': 'rotate(' + degree + 'deg)',
                    '-ms-transform': 'rotate(' + degree + 'deg)',
                    '-o-transform': 'rotate(' + degree + 'deg)',
                    'transform': 'rotate(' + degree + 'deg)',
                    'zoom': 1
                });
            }
        }, {
            key: "getNewAngle",
            value: function getNewAngle(value) {
                var scale = d3.scaleLinear().range([0, 1]).domain([this.lowerLimit, this.upperLimit]);
                var ratio = scale(value);
                var scaleRange = 2 * this.gaugeAngle;
                var minScale = -1 * this.gaugeAngle;
                var newAngle = minScale + ratio * scaleRange;
                return newAngle;
            }
        }, {
            key: "needleObjDimUpdate",
            value: function needleObjDimUpdate(needleObj) {
                needleObj.centerY = this.view.width / 2;
                needleObj.centerX = this.view.width / 2;
                needleObj.circleRadius = this.view.width * 6 / 300;
                needleObj.needleAngle = this.getNewAngle(needleObj.value);
                needleObj.needleLen = this.innerRadius - this.majorGradLength - this.majorGradMarginTop;
                needleObj.needleRadius = this.view.width * 2.5 / 300;
                return needleObj;
            }
        }, {
            key: "removeAllNeedle",
            value: function removeAllNeedle(svg, needleObj) {
                if ($(svg["_groups"][0]).children('.' + needleObj.id).length > 0) {
                    $(svg["_groups"][0]).children('.' + needleObj.id).remove();
                }
            }
        }, {
            key: "removeGradText",
            value: function removeGradText(svg) {
                var svgGradText = $(svg["_groups"][0]).children('.mtt-majorGraduationText');

                if (svgGradText != null && svgGradText.length > 0) {
                    svgGradText.remove();
                }
            }
        }, {
            key: "getMajorGradAngles",
            value: function getMajorGradAngles() {
                var scaleRange = 2 * this.gaugeAngle;
                var minScale = -1 * this.gaugeAngle;
                var graduationsAngles = [];

                for (var i = 0; i <= this.majorGrads; i++) {
                    var scaleValue = minScale + i * scaleRange / this.majorGrads;
                    graduationsAngles.push(scaleValue);
                }

                return graduationsAngles;
            }
        }, {
            key: "getMajorGradValues",
            value: function getMajorGradValues() {
                var scaleRange = this.upperLimit - this.lowerLimit;
                var majorGraduationValues = [];

                for (var i = 0; i <= this.majorGrads; i++) {
                    var scaleValue = this.lowerLimit + i * scaleRange / this.majorGrads;
                    majorGraduationValues.push(scaleValue.toFixed(this.majorGradPrecision));
                }

                return majorGraduationValues;
            }
        }, {
            key: "transAttr",
            value: function transAttr(t1, t2) {
                return "translate(" + t1 + "," + t2 + ")";
            } // ** HELPERS && CALCULATORS END **

        }]);

        return CustomGauge;
    }();
$(document).on("click", ".mtt-graduationValueText, .mtt-graduation-needle", function () {
    var $this = $(this);
    var clickFunc = $this.attr("data-func");
    var clickParams = $this.attr("data-funcparams");

    if (clickFunc != null && clickFunc.length > 0) {
        window[clickFunc](clickParams);
    }
});
