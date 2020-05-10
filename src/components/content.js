import React from 'react'

import { serialize } from 'react-serialize'

import MenuBar from './menu-bar';
import Shape from "./shape"
import Line from "./line"
import Image from "./image"
import Text from "./text"

import open from "../images/new.svg"
import save from "../images/save.svg"
import undo from "../images/undo.svg"
import redo from "../images/redo.svg"

export default class Content extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            elements: [],
            layouts: [],
            guids: [],
            input: false,
            click: false,
            count: 0,
            refs: {}
        }

        this.canvas = React.createRef()

        this.handleClick = this.handleClick.bind(this)
        this.handleMouseDown = this.handleMouseDown.bind(this)
        this.handleMouseMove = this.handleMouseMove.bind(this)
        this.handleMouseUp = this.handleMouseUp.bind(this)
        this.handleSave = this.handleSave.bind(this)
        this.handleClickInside = this.handleClickInside.bind(this)
        this.setBoundry = this.setBoundry.bind(this)
        this.handleAddLineGuid = this.handleAddLineGuid.bind(this)
        this.updateLayout = this.updateLayout.bind(this)
        this.handleOpen = this.handleOpen.bind(this)
        this.handleUndo = this.handleUndo.bind(this)
        this.handleRedo = this.handleRedo.bind(this)

        this.menubarItems = [
            // { name: "Open", image: open, func: this.handleOpen },
            { name: "Save", image: save, func: this.handleSave },
            { name: "Undo", image: undo, func: this.handleUndo },
            { name: "Redo", image: redo, func: this.handleRedo }
        ]

        this.item = {}
        this.history = { el: [[]], ref: [[]] }
        this.currentState = 0
    }

    componentDidMount() {
        this.offsetX = this.canvas.current.getBoundingClientRect().left
        this.offsetY = this.canvas.current.getBoundingClientRect().top
    }
    componentDidUpdate(prevProps, prevState) {
        const { lineType, lineWidth, corner, strokeColor, fillColor, shadow, strong } = this.props
        if (this.props.activeItem === "Move") {
            let prop = null, value = null
            if (lineType != prevProps.lineType) {
                prop = 'dashed'
                value = lineType
            }
            else if (lineWidth != prevProps.lineWidth) {
                prop = 'weight'
                value = lineWidth
            }
            else if (corner != prevProps.corner) {
                prop = 'corner'
                value = corner
            } else if (strokeColor != prevProps.strokeColor) {
                prop = 'stroke'
                value = strokeColor
            } else if (fillColor != prevProps.fillColor) {
                prop = 'fill'
                value = fillColor
            }
            else if (shadow != prevProps.shadow) {
                prop = 'shadow'
                value = shadow
            }
            else if (strong != prevProps.strong) {
                prop = 'strong'
                value = strong
            }
            if (prop) {
                this.state.layouts.forEach(l => {
                    this.state.refs[l[0]].current.updateStyle(prop, value).then(
                        this.snapshot())
                })
                this.state.guids.forEach(g => {
                    this.state.refs[g.id].current.updateStyle(prop, value).then(
                        this.snapshot())
                })
            }
        }
    }

    handleMouseMove(e) {
        if (this.isDrawing) {
            this.state.refs[this.currentItem].current.handleMoving(0, 0, e.movementX, e.movementY)
        }
        if (this.isResizing) {
            this.setState({
                layouts: this.state.layouts.map(l => {
                    if (l[0] in this.item) {
                        let dx = 0, dy = 0, dw = 0, dh = 0
                        if (this.corner === 1) {
                            dx = e.movementX
                            dy = e.movementY
                            dw = - e.movementX
                            dh = - e.movementY
                        } else if (this.corner === 2) {
                            dx = e.movementX
                            dw = - e.movementX
                            dh = e.movementY
                        } else if (this.corner === 3) {
                            dy = e.movementY
                            dw = e.movementX
                            dh = - e.movementY
                        } else if (this.corner === 4) {
                            dw = e.movementX
                            dh = e.movementY
                        } else {
                            dx = e.movementX
                            dy = e.movementY
                        }
                        this.state.refs[l[0]].current.handleMoving(dx, dy, dw, dh)
                        return [l[0], l[1] + dx, l[2] + dy, l[3] + dw, l[4] + dh]
                    }
                    return l
                })
            })
        }
        if (this.isLining) {
            this.state.refs[this.line].current.handleCanvasMove(e, this.anchor)
        }
    }
    handleBoundingMouseDown(corner, bb) {
        const self = this
        return function (e) {
            self.isResizing = true
            self.corner = corner
            self.item[bb[0]] = { x: bb[1], y: bb[2], w: bb[3], h: bb[4] }
        }
    }
    setBoundry(layout) {
        const [id, x, y, w, h] = layout
        return (
            <g onClick={e => e.stopPropagation()}>
                <rect x={x - 2} y={y - 2} width={w + 4} height={h + 4} stroke='gray' stroke-dasharray="5 5" fill='transparent' onMouseDown={this.handleBoundingMouseDown(0, layout)} /> ,
                <circle cx={x - 5} cy={y - 5} r="3" fill="gray" onMouseDown={this.handleBoundingMouseDown(1, layout)} /> ,
                <circle cx={x - 5} cy={y + h + 5} r="3" fill="gray" onMouseDown={this.handleBoundingMouseDown(2, layout)} /> ,
                <circle cx={x + w + 5} cy={y - 5} r="3" fill="gray" onMouseDown={this.handleBoundingMouseDown(3, layout)} /> ,
                <circle cx={x + w + 5} cy={y + h + 5} r="3" fill="gray" onMouseDown={this.handleBoundingMouseDown(4, layout)} />
            </g >
        )
    }
    handleClickInside(id, e, x, y, w, h) {
        if (this.props.activeItem === "Move") {
            console.log('move', id)
            this.setState({ layouts: [...this.state.layouts, [id, x, y, w, h]] })
        }
        else if (this.props.activeItem === "Erase") {
            console.log('erase', id)
            this.setState({ elements: this.state.elements.filter(e => e.id != id) })
        }
        else if (this.props.activeItem == "Copy") {
            const { elements, refs, count } = this.state
            const ref = React.createRef()
            const newE = React.cloneElement(elements.filter(e => e.id == id)[0].e, { x: 10, y: 10, w: refs[id].current.state.w, h: refs[id].current.state.h, id: count, ref: ref, key: count })
            refs[count] = ref
            this.setState({ elements: [...this.state.elements, { id: count, e: newE }], refs, count: count + 1 })
        }
    }

    updateLayout(id, points, inter) {
        const { refs } = this.state
        this.setState({
            guids: this.state.guids.map(g => {
                if (g.id == id) {
                    g.p = points.map((p, i) =>
                        <circle cx={p[0]} cy={p[1]} r="3" fill="gray" onMouseDown={this.handleMoveLineAnchor(i, g.id)} />
                    )
                    g.i = inter.flatMap((p, i) =>
                        [<circle cx={p.p[0]} cy={p.p[1]} r="3" fill="lightblue" stroke="gray" onMouseDown={e => refs[id].current.handleAddAnchor(e, p.id)} />,
                        <circle cx={p.p[0]} cy={p.p[1] - 10} r="3" fill="yellow" stroke="gray" onClick={refs[id].current.addBridge(p.id)} />]
                    )
                }
                return g
            }
            )
        })
    }
    handleMoveLineAnchor(idx, line) {
        const self = this
        return function (e) {
            self.line = line
            self.anchor = idx
            self.isLining = true
        }
    }
    remoteFunction(f) {
        const self = this
        return function () {
            f()
            self.snapshot()
        }
    }
    handleAddLineGuid(id, points, inter, e, handleMove, click) {
        if (this.props.activeItem === "Move") {
            this.setState({
                guids: [...this.state.guids, {
                    "id": id, 'p': points.map((p, i) =>
                        <circle cx={p[0]} cy={p[1]} r="3" fill="gray" onMouseDown={this.handleMoveLineAnchor(i, id)} />
                    ),
                    "i": inter.flatMap((p, i) =>
                        [<circle cx={p.p[0]} cy={p.p[1]} r="3" fill="lightblue" stroke="gray" onMouseDown={this.remoteFunction(e.handleAddAnchor(click, p.id))} />,
                        <circle cx={p.p[0]} cy={p.p[1] - 10} r="3" fill="yellow" stroke="gray" onClick={this.remoteFunction(e.addBridge(p.id))} />]
                    )
                }]
            })
        } else if (this.props.activeItem === "Erase") {
            this.setState({ elements: this.state.elements.filter(e => e.id != id) })
        }
    }

    handleClick(e) {
        const { refs } = this.state
        const { activeItem } = this.props
        let element = null
        this.item = {}
        this.setState({ layouts: [], guids: [] })

        if (activeItem === "Text") {
            const ref = React.createRef()
            element = <Text x={e.clientX - this.offsetX} y={e.clientY - this.offsetY} text="text" weight={this.props.lineWidth} color={this.props.strokeColor} ref={ref} id={this.state.count} />
            if (element) {
                refs[this.state.count] = ref
                this.setState({
                    elements: [...this.state.elements, { id: this.state.count, e: element }],
                    refs,
                    count: this.state.count + 1
                },
                    this.snapshot())
            }
        }
    }
    handleMouseDown(e) {
        const { refs } = this.state
        const { activeItem } = this.props
        const ref = React.createRef()
        let element = null
        if (activeItem === "Move" || activeItem === "Text")
            return
        if (activeItem === "Line" || activeItem === "Arrow" || activeItem === "Bridge")
            element = <Line points={[[e.clientX - this.offsetX, e.clientY - this.offsetY], [e.clientX - this.offsetX, e.clientY - this.offsetY]]} arrow={activeItem == "Arrow"} stroke={this.props.strokeColor} weight={this.props.lineWidth} dashed={this.props.lineType} key={this.state.count} handleAddLineGuid={this.handleAddLineGuid} id={this.state.count}
                path={[]}
                shadow={this.props.shadow}
                corner={this.props.cornerType}
                ref={ref}
                updateLayout={this.updateLayout} />
        else if (activeItem === "Rectangle" || activeItem === "Circle" || activeItem === "Ellipse") {
            element = <Shape x={e.clientX - this.offsetX} y={e.clientY - this.offsetY} w={0} h={0} shape={activeItem} stroke={this.props.strokeColor} fill={this.props.fillColor} dashed={this.props.lineType} weight={this.props.lineWidth} earase={this.state.earase} click={this.state.click}
                // key={this.state.count}
                corner={this.props.cornerType}
                shadow={this.props.shadow}
                clickInside={this.handleClickInside}
                id={this.state.count}
                ref={ref}
            />
        } else if (activeItem === "Image")
            element = <Shape src={URL.createObjectURL(this.props.file[0])} x={e.clientX - this.offsetX} y={e.clientY - this.offsetY} w={0} h={0} shape={activeItem} key={this.state.count}
                clickInside={this.handleClickInside}
                id={this.state.count}
                ref={ref}
            />
        this.isDrawing = true
        this.currentItem = this.state.count
        if (element) {
            refs[this.state.count] = ref
            this.setState({
                elements: [...this.state.elements, { id: this.state.count, e: element }],
                refs,
                count: this.state.count + 1
            })
        }
    }
    handleMouseUp(e) {
        const { activeItem } = this.props
        let element = null

        if (this.isDrawing || this.isLining) {
            this.snapshot()
        }
        this.isDrawing = false
        this.isResizing = false
        this.isMoving = false
        this.isLining = false

        if (this.currentState < this.history.el.length - 1) {
            this.history.el = this.history.el.slice(0, this.currentState + 1)
            this.history.ref = this.history.ref.slice(0, this.currentState + 1)
        }
    }

    snapshot() {
        this.history.el.push(this.state.elements.map(el => {
            let newProps = {};
            Object.keys(el.e.ref.current.state).forEach(p => {
                if (el.e.ref.current.state[p] instanceof Array) newProps[p] = [...el.e.ref.current.state[p]]
                else newProps[p] = el.e.ref.current.state[p]
            })
            return ({ id: el.id, e: React.cloneElement(el.e, newProps) })
        }))
        this.history.ref.push(this.state.refs)
        this.currentState++
    }
    handleSave() {
        var svg = this.canvas.current
        var serializer = new XMLSerializer();
        var source = serializer.serializeToString(svg);
        //add name spaces.
        if (!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
            source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
        }
        if (!source.match(/^<svg[^>]+"http\:\/\/www\.w3\.org\/1999\/xlink"/)) {
            source = source.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
        }
        //add xml declaration
        source = '<?xml version="1.0" standalone="no"?>\r\n' + source;
        //convert svg source to URI data scheme.
        var url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(source);
        let downloadLink = document.createElement('a');
        downloadLink.setAttribute('download', 'CanvasAsImage.svg');
        downloadLink.setAttribute('href', url);
        downloadLink.click();
    }
    handleOpen() {
        this.refs.fileUploader.click();
    }
    onLoad(e) {
        var file = e.target.files[0];
        var reader = new FileReader();
        reader.onload = function (e) {
            var content = reader.result;
        }
        reader.readAsText(file);
    }
    handleUndo() {
        if (this.currentState < 1) return
        this.currentState--
        this.setState({ elements: [], refs: [], layouts: [], guids: [] },
            () => this.setState({ elements: this.history.el[this.currentState], refs: this.history.ref[this.currentState] }))
    }
    handleRedo() {
        if (this.currentState > this.history.el.length - 2) return
        this.currentState++
        this.setState({ elements: [], refs: [], layouts: [], guids: [] },
            () => this.setState({ elements: this.history.el[this.currentState], refs: this.history.ref[this.currentState] }))
    }

    render() {
        const { elements, layouts, guids } = this.state
        // console.log(elements)
        return (
            <div
                style={{ width: '100%', height: '100%', background: '#e5f5ee', backgroundImage: "url('src/images/grid.png')", backgroundSize: "200px 200px", display: 'flex' }}
            >
                <MenuBar items={this.menubarItems} />
                <input type="file" id="fileInput" ref="fileUploader" onChange={this.onLoad} style={{ display: "none" }} />
                <div
                    style={{ width: '100%', height: '100%' }}
                // dangerouslySetInnerHTML={{ __html: '<svg xmlns:xlink="http://www.w3.org/1999/xlink" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%"><g><g><rect x="336" y="149" width="95" height="68" stroke="black" stroke-width="3" fill="transparent"/></g></g><g/><g/></svg>' }}
                >
                    <svg
                        ref={this.canvas}
                        width="100%" height="100%"
                        onClick={this.handleClick}
                        onMouseDown={this.handleMouseDown}
                        onMouseUp={this.handleMouseUp}
                        onMouseMove={this.handleMouseMove}
                    >
                        <g>
                            {elements.map((e, idx) => e.e)}
                        </g>
                        <g>
                            {layouts.map(l => this.setBoundry(l))}
                        </g>
                        <g>
                            {guids.map(g => <g onClick={e => e.stopPropagation()} >{g.p.concat(g.i)}</g>)}
                        </g>
                    </svg>
                </div>
            </div>
        )
    }
}