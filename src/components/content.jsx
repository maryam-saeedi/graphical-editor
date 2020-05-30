import React from 'react'
import { withStyles, makeStyles } from '@material-ui/core/styles';
import ReactHtmlParser, { processNodes, convertNodeToElement, htmlparser2 } from 'react-html-parser';

import { serialize } from 'react-serialize'

import DialogTitle from '@material-ui/core/DialogTitle';
import Dialog from '@material-ui/core/Dialog';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import Slider from '@material-ui/core/Slider';

import MenuBar from './menu-bar';
import Shape from "./shape"
import Line from "./line"
import Image from "./image"
import Text from "./text"

import zoomin from "../images/zoom-in.svg"
import zoomout from "../images/zoom-out.svg"
import open from "../images/new.svg"
import save from "../images/save.svg"
import undo from "../images/undo.svg"
import redo from "../images/redo.svg"
import { ContentAdd } from 'material-ui/svg-icons';
import ColorPicker from './color-panel';
import { bgcolor } from '@material-ui/system';

const CustomSlider = withStyles({
    root: {
        color: '#52af77',
        height: 3,
    },
    thumb: {
        height: 14,
        width: 14,
        backgroundColor: '#fff',
        border: '2px solid currentColor',
        '&:focus, &:hover, &$active': {
            boxShadow: 'inherit',
        },
        '&::after': {
            top: 0,
            bottom: 0,
            right: 0,
            left: 0
        }
    },
    active: {},
    valueLabel: {
        left: 'calc(-50% + 4px)',
    },
    track: {
        height: 3,
        borderRadius: 4,
    },
    rail: {
        height: 3,
        borderRadius: 4,
        opacity: 1
    },
})(Slider);

export default class Content extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            elements: [],
            boundingBox: {},
            input: false,
            click: false,
            count: 0,
            refs: {},
            open: false,
            positionX: null,
            positionY: null,
            objectW: 0,
            objectH: 0,
            zoom: 1,
            bgColor: '#e5f5ee'
        }

        this.canvas = React.createRef()

        this.handleClick = this.handleClick.bind(this)
        this.handleMouseDown = this.handleMouseDown.bind(this)
        this.handleMouseMove = this.handleMouseMove.bind(this)
        this.handleMouseUp = this.handleMouseUp.bind(this)
        this.handleSave = this.handleSave.bind(this)
        this.handleClickInside = this.handleClickInside.bind(this)
        this.handleOpen = this.handleOpen.bind(this)
        this.handleUndo = this.handleUndo.bind(this)
        this.handleRedo = this.handleRedo.bind(this)
        this.handleClose = this.handleClose.bind(this)
        this.handleAddLogic = this.handleAddLogic.bind(this)
        this.applyLogic = this.applyLogic.bind(this)
        this.onLoad = this.onLoad.bind(this)
        this.transformation = this.transformation.bind(this)
        this.handleBoundryClick = this.handleBoundryClick.bind(this)
        this.handleLayoutUpdate = this.handleLayoutUpdate.bind(this)
        this.handleShapeChange = this.handleShapeChange.bind(this)
        this.handleDeselect = this.handleDeselect.bind(this)
        this.handleChangeZoom = this.handleChangeZoom.bind(this)
        this.handleBGChange = this.handleBGChange.bind(this)
        this.handlekeyUp = this.handlekeyUp.bind(this)

        this.menubarItems = [
            { name: "Open", image: open, func: this.handleOpen },
            { name: "Save", image: save, func: this.handleSave },
            { name: "Undo", image: undo, func: this.handleUndo },
            { name: "Redo", image: redo, func: this.handleRedo }
        ]

        this.item = {}
        this.history = { el: [[]], ref: [[]] }
        this.currentState = 0
        this.offsetW = "100%"
        this.offsetH = "100%"
        this.move = null
        this.selected = []
        this.multiCopy = []
    }

    componentDidMount() {
        this.offsetX = this.canvas.current.getBoundingClientRect().left
        this.offsetY = this.canvas.current.getBoundingClientRect().top
        this.offsetW = this.canvas.current.getBoundingClientRect().width
        this.offsetH = this.canvas.current.getBoundingClientRect().height
    }
    componentDidUpdate(prevProps, prevState) {
        const { dashed, weight, cornerType, stroke, fill, shadow, strong, font, size, bold, width, height } = this.props
        if (this.props.activeItem != prevProps.activeItem && (this.props.activeItem == "Erase" || this.props.activeItem == "Copy")) {
            this.selected = []
            this.setState({ boundingBox: {} })
        }
        if (this.props.activeItem === "Move") {
            let prop = null, value = null
            if (dashed != prevProps.dashed) {
                prop = 'dashed'
                value = dashed
            } else if (weight != prevProps.weight) {
                prop = 'weight'
                value = weight
            } else if (cornerType != prevProps.cornerType) {
                prop = 'corner'
                value = cornerType
            } else if (stroke != prevProps.stroke) {
                prop = 'stroke'
                value = stroke
            } else if (fill != prevProps.fill) {
                prop = 'fill'
                value = fill
            } else if (shadow != prevProps.shadow) {
                prop = 'shadow'
                value = shadow
            } else if (strong != prevProps.strong) {
                prop = 'strong'
                value = strong
            } else if (font != prevProps.font) {
                prop = 'font'
                value = font
            } else if (size != prevProps.size) {
                prop = 'size'
                value = size
            } else if (bold != prevProps.bold) {
                prop = 'bold'
                value = bold
            }
            if (prop) {
                this.selected.forEach(s => {
                    this.state.refs[s].current.updateStyle(prop, value).then(res => this.snapshot())
                })
                return
            }
            if (width != prevProps.width) {
                prop = 'w'
                value = width
            } else if (height != prevProps.height) {
                prop = 'h'
                value = height
            }
            if (prop) {
                this.selected.forEach(s => {
                    this.state.refs[s].current.setSize(prop, value).then(res => this.snapshot())
                })
                return
            }
        }
    }

    handleMouseMove(e) {
        this.setState({ positionX: e.clientX - this.offsetX, positionY: e.clientY - this.offsetY })

        const scale = this.state.zoom
        if (this.resizedItem != undefined) {
            // this.state.refs[this.resizedItem].current.move(scale * e.movementX, scale * e.movementY)
            const corner = this.state.refs[this.resizedItem].current.getCorner()
            this.selected.forEach(s => { this.state.refs[s].current.setCorner(corner); this.state.refs[s].current.move(scale * e.movementX, scale * e.movementY) })
        }
        if (this.isDrawing) {
            const { x, y, w, h } = this.state.refs[this.currentItem].current.handleMoving(0, 0, scale * e.movementX, scale * e.movementY)
            this.props.selectItem(null, { 'width': w, 'height': h })
            this.setState({ objectW: e.clientX - this.offsetX - this.state.startX, objectH: e.clientY - this.state.startY - this.offsetY })
        }
    }
    handleBoundryClick(id) {
        this.resizedItem = id
        this.isMoving = true
        // this.setState({ startX: this.state.refs[id].state.x, startY: this.state.refd[id].state.y })
    }
    handleDeselect(id) {
        const { boundingBox } = this.state
        delete boundingBox[id]
        const index = this.selected.indexOf(id);
        if (index > -1) {
            this.selected.splice(index, 1);
        }
        this.setState({ boundingBox })
        let type = new Set()
        this.selected.forEach(s => this.state.refs[s].current instanceof Shape ? type.add('Shape') : this.state.refs[s].current instanceof Line ? type.add('Line') : this.state.refs[s].current instanceof Text ? type.add('Text') : type.add('None'))
        this.props.selectItem(type, this.selected.length > 0 ? this.state.refs[this.selected[this.selected.length - 1]].current.getStyle() : {})
    }
    select(id) {
        let type = new Set()
        const { boundingBox } = this.state
        boundingBox[id] = this.state.refs[id].current.setBoundry()
        this.setState({ boundingBox })
        // this.setState({ boundingBox: { ...this.state.boundingBox, [id]: this.state.refs[id].current.setBoundry() } })
        this.selected = [...this.selected, id]
        this.selected.forEach(s => this.state.refs[s].current instanceof Shape ? type.add('Shape') : this.state.refs[s].current instanceof Line ? type.add('Line') : this.state.refs[s].current instanceof Text ? type.add('Text') : type.add('None'))
        this.props.selectItem(type, this.state.refs[id].current.getStyle())
    }
    handleClickInside(id, ctrl = false) {
        if (this.props.activeItem === "Move") {
            this.select(id)
        }
        else if (this.props.activeItem === "Erase") {
            const { refs } = this.state
            delete refs[id]
            this.setState({ elements: this.state.elements.filter(e => e.id != id), refs }, () => this.snapshot())
        }
        else if (this.props.activeItem == "Copy") {
            const { elements, refs, count } = this.state
            const { changeTool } = this.props
            const ref = React.createRef()
            const newE = React.cloneElement(elements.filter(e => e.id == id)[0].e, { ...refs[id].current.state, id: count, ref: ref, key: count })
            refs[count] = ref
            if (ctrl) {
                this.multiCopy.push(count)
            }
            this.setState({ elements: [...this.state.elements, { id: count, e: newE }], refs, count: count + 1 }, () => { if (ctrl) return; changeTool(null, "Move"); this.handleClickInside(count) })
        }
    }

    applyLogic() {
        this.state.refs[this.logicTarget].current.handleLogic(this.logic)
        this.handleClose()
    }
    handleAddLogic(id, logic) {
        this.logic = logic
        this.logicTarget = id
        this.setState({ open: true })
    }
    handleLayoutUpdate(id, layout, w, h) {
        const { boundingBox } = this.state
        boundingBox[id] = layout
        this.setState({ boundingBox, objectW: w, objectH: h })
        this.props.selectItem(null, { 'width': w, 'height': h })
    }
    handleClick(e) {
        const { refs, zoom } = this.state
        const { activeItem } = this.props
        const scale = zoom
        let element = null
        this.item = {}
        this.setState({ boundingBox: {} })
        this.selected = []

        if (activeItem === "Text") {
            const ref = React.createRef()
            element = <Text x={scale * (e.clientX - this.offsetX)} y={scale * (e.clientY - this.offsetY)}
                text="" size={this.props.size}
                stroke={this.props.stroke} fill={this.props.fill}
                font={this.props.font} bold={this.props.bold}
                ref={ref} id={this.state.count} key={this.state.count}
                clickInside={this.handleClickInside}
                handleBoundryClick={this.handleBoundryClick}
                addLogic={this.handleAddLogic}
                changeShape={this.handleShapeChange}
                deselect={this.handleDeselect}
                updateLayout={this.handleLayoutUpdate} />
            if (element) {
                refs[this.state.count] = ref
                this.setState({
                    elements: [...this.state.elements, { id: this.state.count, e: element }],
                    refs,
                    count: this.state.count + 1
                })
            }
        }
    }
    handleMouseDown(e) {
        const { refs, zoom } = this.state
        const { activeItem } = this.props
        const ref = React.createRef()
        const scale = zoom
        let element = null
        this.setState({ startX: e.clientX - this.offsetX, startY: e.clientY - this.offsetY })
        if (activeItem === "Move" || activeItem === "Text" || activeItem === "Erase" || activeItem === "Copy")
            return
        if (activeItem === "Line" || activeItem === "Arrow" || activeItem === "Bridge")
            element = <Line
                points={[[scale * (e.clientX - this.offsetX), scale * (e.clientY - this.offsetY)], [scale * (e.clientX - this.offsetX), scale * (e.clientY - this.offsetY)]]}
                arrow={activeItem == "Arrow"} stroke={this.props.stroke} weight={this.props.weight} dashed={this.props.dashed}
                key={this.state.count}
                id={this.state.count}
                path={[]}
                shadow={this.props.shadow}
                corner={this.props.cornerType}
                ref={ref}
                addLogic={this.handleAddLogic}
                clickInside={this.handleClickInside}
                handleBoundryClick={this.handleBoundryClick}
                updateLayout={this.handleLayoutUpdate}
                deselect={this.handleDeselect}
                changeShape={this.handleShapeChange}
            />
        else if (activeItem === "Rectangle" || activeItem === "Circle" || activeItem === "Ellipse" || activeItem === "Triangle") {
            element = <Shape x={scale * (e.clientX - this.offsetX)} y={scale * (e.clientY - this.offsetY)} w={0} h={0} shape={activeItem} stroke={this.props.stroke} fill={this.props.fill} dashed={this.props.dashed} weight={this.props.weight} earase={this.state.earase} click={this.state.click}
                key={this.state.count}
                corner={this.props.cornerType}
                shadow={this.props.shadow}
                clickInside={this.handleClickInside}
                id={this.state.count}
                ref={ref}
                handleBoundryClick={this.handleBoundryClick}
                updateLayout={this.handleLayoutUpdate}
                deselect={this.handleDeselect}
                rotatable={this.props.activeItem==="Triangle"}
            />
        } else if (activeItem === "Image")
            element = <Shape file={this.props.file[0]} src={null} x={scale * (e.clientX - this.offsetX)} y={scale * (e.clientY - this.offsetY)} w={0} h={0} shape={activeItem} key={this.state.count}
                clickInside={this.handleClickInside}
                id={this.state.count}
                ref={ref}
                handleBoundryClick={this.handleBoundryClick}
                updateLayout={this.handleLayoutUpdate}
                deselect={this.handleDeselect}
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

        this.setState({ startX: null, startY: null })
        if (this.isDrawing || this.isResizing || this.isLining || this.isMoving) {
            this.snapshot()
        }
        this.isDrawing = false
        this.isResizing = false
        this.isMoving = false
        this.isLining = false
        this.resizedItem = null

    }
    handleKeyDown(e) {
        const scale = this.state.zoom
        if (this.selected.length > 2) {
            if (e.shiftKey) {
                let loc = {}
                this.selected.forEach(s => loc[s] = this.state.refs[s].current.getLocation())
                const xs = Object.values(loc).map(l => l.x)
                const ys = Object.values(loc).map(l => l.y)
                const xs_ = Object.values(loc).map(l => l.x + l.w)
                const ys_ = Object.values(loc).map(l => l.y + l.h)
                const sorted = Object.keys(loc).sort(function (a, b) { return loc[a].x - loc[b].x })
                if (e.key == 'v' || e.key == 'V'){
                    const miny = Math.min(...ys)
                    const maxy = Math.max(...ys_)
                    const totalh = Object.values(loc).map(l => l.h).reduce((total, num) => total + num)
                    const dis = (maxy - miny - totalh) / (this.selected.length-1)
                    let offset = miny
                    sorted.forEach((s,i) => {this.state.refs[s].current.setSize('y', offset + i * dis); offset+=(loc[s].h)})
                } else if (e.key == 'h' || e.key == 'H') {
                    const minx = Math.min(...xs)
                    const maxx = Math.max(...xs_)
                    const totalw = Object.values(loc).map(l => l.w).reduce((total, num) => total + num)
                    const dis = (maxx - minx - totalw) / (this.selected.length-1)
                    let offset = minx
                    sorted.forEach((s,i) => {this.state.refs[s].current.setSize('x', offset + i * dis); offset+=(loc[s].w)})
                }
            }
        }
        if (this.selected.length === 1) {
            if (e.key === "PageUp") {
                let { elements } = this.state
                let target
                elements = elements.filter(e => { if (e.id == this.selected[0]) target = e; else return true })
                elements.push(target)
                this.setState({ elements })
            } else if (e.key === "PageDown") {
                let { elements } = this.state
                let target
                elements = elements.filter(e => { if (e.id == this.selected[0]) target = e; else return true })
                elements.splice(0, 0, target)
                this.setState({ elements })
            }
        }
        let dx = 0, dy = 0
        let xs = [], ys = [], xs_ = [], ys_ = []
        this.selected.forEach(s => { const loc = this.state.refs[s].current.getLocation(); xs.push(loc.x); xs_.push(loc.x + loc.w); ys.push(loc.y); ys_.push(loc.y + loc.h) })
        let dir, pos
        switch (e.key) {
            case "Up":
            case "ArrowUp":
                dy = -1
                dir = "Up"
                pos = Math.min(...ys)
                break
            case "Down":
            case "ArrowDown":
                dy = 1
                dir = "Down"
                pos = Math.max(...ys_)
                break
            case "Right":
            case "ArrowRight":
                dx = 1
                dir = "Right"
                pos = Math.max(...xs_)
                break
            case "Left":
            case "ArrowLeft":
                dx = -1
                dir = "Left"
                pos = Math.min(...xs)
                break
        }
        if (e.shiftKey) this.selected.forEach(s => this.state.refs[s].current.handleAlign(dir, pos))
        else this.selected.forEach(s => this.state.refs[s].current.move(scale * dx, scale * dy))
    }
    handlekeyUp(e) {
        if (this.multiCopy.length > 0) {
            console.log(this.multiCopy)
            this.props.changeTool(null, 'Move')
            this.multiCopy.forEach(c => this.select(c))
            this.multiCopy = []
        }
    }

    handleShapeChange() {
        // console.log('shape change')
        this.snapshot()
    }
    snapshot() {
        if (this.currentState < this.history.el.length - 1) {
            this.history.el = this.history.el.slice(0, this.currentState + 1)
            this.history.ref = this.history.ref.slice(0, this.currentState + 1)
        }
        this.history.el.push(this.state.elements.map(el => {
            let newProps = {};
            Object.keys(el.e.ref.current.state).forEach(p => {
                if (el.e.ref.current.state[p] instanceof Array) newProps[p] = JSON.parse(JSON.stringify(el.e.ref.current.state[p]))
                else newProps[p] = el.e.ref.current.state[p]
            })
            newProps['key'] = el.id
            return ({ id: el.id, e: React.cloneElement(el.e, newProps) })
        }))
        this.history.ref.push(this.state.refs)
        this.currentState++
        // console.log(this.history.el, this.state.elements.length)
    }
    handleSave() {
        var svg = this.canvas.current
        var serializer = new XMLSerializer();
        var source = serializer.serializeToString(svg);
        //add name spaces.
        source = source.replace(/style="/, `style="background: ${this.state.bgColor};`);
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
    transformation(node, index) {
        if (node.name === 'g' && node.attribs.element) {
            const { refs, count } = this.state
            const ref = React.createRef()
            let element = null
            refs[count] = ref
            let props = JSON.parse(node.attribs.props)
            props['id'] = count
            props['key'] = count
            props['ref'] = ref
            if (node.attribs.element === "Shape") {
                props['clickInside'] = this.handleClickInside
                element = React.createElement(Shape, props)
            } else if (node.attribs.element === "Line") {
                element = React.createElement(Line, props)
            } else if (node.attribs.element === "Text") {
                element = React.createElement(Text, props)
            }
            this.setState({ elements: [...this.state.elements, { id: this.state.count, e: element }], refs, count: this.state.count + 1 })
        }
    }
    onLoad(e) {
        var file = e.target.files[0];
        var reader = new FileReader();
        this.setState({ elements: [], refs: {}, count: 0 })

        const self = this
        reader.onload = function (e) {
            var content = reader.result;
            content = content.replace('xmlns="http://www.w3.org/2000/svg"', "");
            content = content.replace('xmlns:xlink="http://www.w3.org/1999/xlink"', "");
            content = content.replace(/^<\?xml[^>]*>/, "")
            // console.log(content)
            const canvas = ReactHtmlParser(content, { transform: self.transformation })
            // console.log(canvas)
        }
        reader.readAsText(file);
    }
    handleUndo() {
        if (this.currentState < 1) return
        this.currentState--
        // console.log('undo', this.currentState, this.history.el.map(e => e[0] && e[0].e.props.path.map(p => p.join(" ")).join(" ")),
        //     this.history.el[this.currentState][0].e.props.path.map(p => p.join(" ")).join(" "))
        this.setState({ elements: [], refs: [], boundingBox: [] },
            () => this.setState({ elements: this.history.el[this.currentState], refs: this.history.ref[this.currentState] }))
    }
    handleRedo() {
        if (this.currentState > this.history.el.length - 2) return
        this.currentState++
        this.setState({ elements: [], refs: [], boundingBox: [] },
            () => this.setState({ elements: this.history.el[this.currentState], refs: this.history.ref[this.currentState] }))
    }

    handleClose() {
        this.setState({ open: false })
    }
    handleChangeZoom(event, newValue) {
        this.setState({ zoom: newValue })
    }
    handleBGChange(color) {
        this.setState({ bgColor: color.hex })
    }

    render() {
        const { elements, boundingBox, open, positionX, positionY, startX, startY, objectW, objectH, zoom, bgColor } = this.state
        // console.log(bgColor)

        return (
            <div
                style={{ flex: 1, backgroundColor: bgColor, backgroundImage: "url('src/images/grid.png')", backgroundSize: "200px 200px", display: 'flex', overflow: 'auto' }}
            >
                <MenuBar items={this.menubarItems} />
                <input type="file" id="fileInput" ref="fileUploader" onChange={this.onLoad} style={{ display: "none" }} />
                <div
                    // style={{ flex: 1 }}
                    style={{ width: '100%', height: '100%', overflow: 'auto', position: 'relative' }}
                // dangerouslySetInnerHTML={{ __html: '<svg xmlns:xlink="http://www.w3.org/1999/xlink" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%"><g><g><rect x="336" y="149" width="95" height="68" stroke="black" stroke-width="3" fill="transparent"/></g></g><g/><g/></svg>' }}
                >
                    <svg
                        viewBox={`0 0 ${zoom * (this.offsetW)} ${zoom * (this.offsetH)}`}
                        ref={this.canvas}
                        width={this.offsetW} height={this.offsetH}
                        style={{ display: 'block' }}
                        onClick={this.handleClick}
                        onMouseDown={this.handleMouseDown}
                        onMouseUp={this.handleMouseUp}
                        onMouseMove={this.handleMouseMove}
                        onKeyDown={e => this.handleKeyDown(e)}
                        onKeyUp={this.handlekeyUp}
                        tabIndex={0}
                    >
                        <g>
                            {elements.map((e, idx) => e.e)}
                        </g>
                        <g>
                            {Object.values(boundingBox).map(b => b)}
                        </g>
                    </svg>
                    <div style={{ position: 'absolute', bottom: 0, background: 'white', height: '30px', width: '100%', display: 'flex' }}>
                        {/* <img src={`data:image/jpeg;base64,${data}`} /> */}
                        {positionX && <span style={{ margin: '0 20px' }}>{positionX}, {positionY}px</span>}
                        {/* {this.isDrawing && <span style={{ margin: '0 20px' }}>{positionX - startX} &times; {positionY - startY} px</span>} */}
                        {(this.isMoving || this.isDrawing) && <span style={{ margin: '0 20px' }}>{objectW} &times; {objectH} px</span>}
                        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', margin: '0 50px 0 auto' }}>
                            <div style={{ width: "20px", height: "20px", margin: '0 10px' }} dangerouslySetInnerHTML={{ __html: zoomin }} />
                            <CustomSlider
                                value={zoom}
                                min={0.5}
                                max={2}
                                step={0.1}
                                onChange={this.handleChangeZoom}
                                style={{ width: '100px', padding: 0 }} />
                            <div style={{ width: "20px", height: "20px", margin: '0 10px' }} dangerouslySetInnerHTML={{ __html: zoomout }} />
                        </div>
                        <ColorPicker color={bgColor} handleSetColor={this.handleBGChange} closeOnSelect width='20px' />
                    </div>
                </div>
                <Dialog onClose={this.handleClose} aria-labelledby="simple-dialog-title" open={open}>
                    <DialogTitle id="simple-dialog-title">Add Logic Vaiable to Element</DialogTitle>
                    <TextField id="standard-basic" label="data variable name" onChange={e => this.logic = e.target.value} value={this.logic} style={{ margin: '10px 50px' }} />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', padding: "10px 30px" }}>
                        <Button onClick={this.handleClose}>skip</Button>
                        <Button onClick={this.applyLogic}>Apply</Button>
                    </div>
                </Dialog>
            </div>
        )
    }
}