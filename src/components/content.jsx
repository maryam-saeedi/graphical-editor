import React, { createElement } from 'react'
import { withStyles, makeStyles } from '@material-ui/core/styles';
import ReactHtmlParser, { processNodes, convertNodeToElement, htmlparser2 } from 'react-html-parser';
import cloneDeep from 'lodash/cloneDeep'

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
        this.history = [[]]
        this.currentState = 0
        this.offsetW = "100%"
        this.offsetH = "100%"
        this.move = null
        this.selected = []
        this.multiCopy = []
        this.isMouseUp = false
        this.isMoving = false
        this.isDrawing = false
        this.isTexting = false
        this.ignore = false
    }

    componentDidMount() {
        this.offsetX = this.canvas.current.getBoundingClientRect().left
        this.offsetY = this.canvas.current.getBoundingClientRect().top
        this.offsetW = this.canvas.current.getBoundingClientRect().width
        this.offsetH = this.canvas.current.getBoundingClientRect().height
    }
    componentDidUpdate(prevProps, prevState) {
        const { dashed, weight, cornerType, stroke, fill, shadow, strong, font, size, bold, rtl, width, height, alignType, activeItem } = this.props
        const { refs } = this.state
        if (activeItem != prevProps.activeItem && activeItem !== "Move") {
            this.selected = []
            this.setState({ boundingBox: {} })
        }
        if (alignType != prevProps.alignType && alignType)
            this.handleAlign()
        if (activeItem === "Move") {
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
            } else if (rtl != prevProps.rtl) {
                prop = 'rtl'
                value = rtl
            }
            if (prop) {
                this.selected.forEach(s => {
                    refs[s].current.updateStyle(prop, value).then(res => this.snapshot())
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
                    refs[s].current.setSize(prop, value).then(res => this.snapshot())
                })
                return
            }
        }
    }

    handleMouseMove(e) {
        this.setState({ positionX: e.clientX - this.offsetX, positionY: e.clientY - this.offsetY })
        const scale = this.state.zoom
        const { refs } = this.state
        if (this.isDrawing) {
            refs[this.currentItem].current.handleMoving(0, 0, scale * e.movementX, scale * e.movementY).then(res => { this.props.selectItem(null, { 'width': res.w, 'height': res.h }) })
            this.setState({ objectW: e.clientX - this.offsetX - this.startX, objectH: e.clientY - this.startY - this.offsetY })
        }
        if (this.resizedItem != undefined) {
            // refs[this.resizedItem].current.move(scale * e.movementX, scale * e.movementY)
            const corner = refs[this.resizedItem].current.getCorner()
            this.selected.forEach(s => { refs[s].current.setCorner(corner); refs[s].current.move(scale * e.movementX, scale * e.movementY) })
            this.isMoving = true
        }
    }
    handleBoundryClick(id) {
        this.resizedItem = id
        // this.isMoving = true
        // this.setState({ startX: this.state.refs[id].state.x, startY: this.state.refd[id].state.y })
    }
    handleDeselect(id) {
        const { refs, boundingBox } = this.state
        const { selectItem } = this.props
        delete boundingBox[id]
        const index = this.selected.indexOf(id);
        if (index > -1) {
            this.selected.splice(index, 1);
        }
        this.setState({ boundingBox })
        let type = new Set()
        this.selected.forEach(s => refs[s].current instanceof Shape ? type.add('Shape') : refs[s].current instanceof Line ? type.add('Line') : refs[s].current instanceof Text ? type.add('Text') : type.add('None'))
        selectItem(type, this.selected.length > 0 ? refs[this.selected[this.selected.length - 1]].current.getStyle() : {})
    }
    select(id) {
        let type = new Set()
        const { refs, boundingBox } = this.state
        const { selectItem } = this.props
        boundingBox[id] = refs[id].current.setBoundry()
        this.setState({ boundingBox })
        // this.setState({ boundingBox: { ...boundingBox, [id]: refs[id].current.setBoundry() } })
        this.selected = [...this.selected, id]
        this.selected.forEach(s => refs[s].current instanceof Shape ? type.add('Shape') : refs[s].current instanceof Line ? type.add('Line') : refs[s].current instanceof Text ? type.add('Text') : type.add('None'))
        selectItem(type, refs[id].current.getStyle())
    }
    handleClickInside(id, ctrl = false) {
        const { activeItem, changeTool } = this.props
        const { elements, refs, count } = this.state
        if (activeItem === "Move") {
            if (this.isMouseUp) return
            this.currentItem = id
            this.select(id)
        }
        else if (activeItem === "Erase") {
            delete refs[id]
            this.setState({ elements: elements.filter(e => e.id != id), refs }, () => this.snapshot())
        }
        else if (this.props.activeItem == "Copy") {
            const ref = React.createRef()
            const newProps = JSON.parse(JSON.stringify(refs[id].current.state))
            const newE = React.cloneElement(elements.filter(e => e.id == id)[0].e, { ...newProps, x: refs[id].current.state.x + 10, y: refs[id].current.state.y + 10, id: count, ref: ref, key: count })
            refs[count] = ref
            if (ctrl) {
                this.multiCopy.push(count)
            }
            this.setState({ elements: [...elements, { id: count, e: newE }], refs, count: count + 1 }, () => { if (ctrl) return; changeTool(null, "Move"); this.select(count) })
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
        const { selectItem } = this.props
        boundingBox[id] = layout
        this.setState({ boundingBox, objectW: w, objectH: h })
        selectItem(null, { 'width': w, 'height': h })
    }
    handleClick(e) {
        const { selectItem } = this.props
        if (!this.isMouseUp) {
            this.selected = []
            this.setState({ boundingBox: {} })
            selectItem(new Set(), {})
            return
        }
        // this.setState({ startX: null, startY: null })
        this.startX = null
        this.startY = null
    }
    handleMouseDown(e) {
        const { refs, zoom, count, elements } = this.state
        const { activeItem, stroke, weight, dashed, shadow, cornerType, fill, size, font, rtl, bold, file } = this.props

        const ref = React.createRef()
        const scale = zoom
        let element = null
        this.isMouseUp = false
        // this.setState({ startX: e.clientX - this.offsetX, startY: e.clientY - this.offsetY })
        this.startX = e.clientX - this.offsetX
        this.startY = e.clientY - this.offsetY
        if (activeItem === "Move" || activeItem === "Erase" || activeItem === "Copy")
            return
        if (activeItem === "Line" || activeItem === "Arrow" || activeItem === "Bridge")
            element = <Line
                points={[[scale * (e.clientX - this.offsetX), scale * (e.clientY - this.offsetY)], [scale * (e.clientX - this.offsetX), scale * (e.clientY - this.offsetY)]]}
                arrow={activeItem == "Arrow"} stroke={stroke} weight={weight} dashed={dashed}
                key={count}
                id={count}
                path={[]}
                shadow={shadow}
                corner={cornerType}
                ref={ref}
                addLogic={this.handleAddLogic}
                clickInside={this.handleClickInside}
                handleBoundryClick={this.handleBoundryClick}
                updateLayout={this.handleLayoutUpdate}
                deselect={this.handleDeselect}
                changeShape={this.handleShapeChange}
            />
        else if (activeItem === "Rectangle" || activeItem === "Circle" || activeItem === "Ellipse" || activeItem === "Triangle") {
            element = <Shape x={scale * (e.clientX - this.offsetX)} y={scale * (e.clientY - this.offsetY)} w={0} h={0}
                shape={activeItem}
                stroke={stroke} fill={fill}
                dashed={dashed} weight={weight}
                key={count}
                corner={cornerType}
                shadow={shadow}
                clickInside={this.handleClickInside}
                id={count}
                ref={ref}
                handleBoundryClick={this.handleBoundryClick}
                updateLayout={this.handleLayoutUpdate}
                deselect={this.handleDeselect}
                rotatable={activeItem === "Triangle"}
            />
        } else if (activeItem === "Image")
            element = <Shape file={file[0]} src={null} x={scale * (e.clientX - this.offsetX)} y={scale * (e.clientY - this.offsetY)}
                w={0} h={0} shape={activeItem} key={count}
                clickInside={this.handleClickInside}
                id={count}
                ref={ref}
                handleBoundryClick={this.handleBoundryClick}
                updateLayout={this.handleLayoutUpdate}
                deselect={this.handleDeselect}
            />
        else if (activeItem === "Text") {
            element = <Text x={scale * (e.clientX - this.offsetX)} y={scale * (e.clientY - this.offsetY)}
                size={size}
                stroke={stroke} fill={fill}
                font={font} bold={bold}
                rtl={rtl}
                ref={ref} id={count} key={count}
                clickInside={this.handleClickInside}
                handleBoundryClick={this.handleBoundryClick}
                addLogic={this.handleAddLogic}
                // changeShape={this.handleShapeChange}
                deselect={this.handleDeselect}
                updateLayout={this.handleLayoutUpdate} />
            this.isTexting = true
            // this.currentItem = count
        }
        this.isDrawing = true
        this.currentItem = count
        if (element) {
            refs[count] = ref
            this.setState({
                elements: [...elements, { id: count, e: element }],
                refs,
                count: count + 1
            })
        }
    }
    handleMouseUp(e) {
        const { changeTool } = this.props
        if (this.isDrawing || this.isMoving || this.isTexting) {
            this.snapshot()
            this.isMouseUp = true
        }
        if (this.isDrawing || this.isTexting) {
            changeTool(null, 'Move')
            this.select(this.currentItem)
        }
        this.isTexting = false
        this.isDrawing = false
        this.isMoving = false
        this.resizedItem = null
    }
    handleAlign() {
        const { alignType } = this.props
        if (alignType === "Align Right")
            this.align('right')
        else if (alignType === "Align Left")
            this.align('left')
        else if (alignType === "Align Top")
            this.align('top')
        else if (alignType === "Align Bottom")
            this.align('bottom')
        else if (alignType === "Distribute Horizontally")
            this.distribute('h')
        else if (alignType === "Distribute Vertically")
            this.distribute('v')
        else if (alignType === "Bring To Front")
            this.arrange('front')
        else if (alignType === "Send To Back")
            this.arrange('back')

    }
    arrange(type) {
        if (this.selected.length != 1)
            return
        let { elements } = this.state
        let target
        elements = elements.filter(e => { if (e.id == this.selected[0]) target = e; else return true })
        if (type == 'front')
            elements.push(target)
        else if (type == 'back')
            elements.splice(0, 0, target)

        this.setState({ elements })
        this.snapshot()
    }
    align(type) {
        if (this.selected.length < 2)
            return
        const { refs } = this.state
        let xs = [], ys = [], xs_ = [], ys_ = []
        this.selected.forEach(s => { const loc = refs[s].current.getSize(); xs.push(loc.x); xs_.push(loc.x + loc.w); ys.push(loc.y); ys_.push(loc.y + loc.h) })
        let dir, pos
        switch (type) {
            case 'top':
                dir = "Up"
                pos = Math.min(...ys)
                break
            case 'bottom':
                dir = "Down"
                pos = Math.max(...ys_)
                break
            case 'right':
                dir = "Right"
                pos = Math.max(...xs_)
                break
            case 'left':
                dir = "Left"
                pos = Math.min(...xs)
                break
        }
        this.selected.forEach(s => refs[s].current.handleAlign(dir, pos))
        this.snapshot()
    }
    distribute(type) {
        if (this.selected.length < 3)
            return

        const { refs } = this.state
        let loc = {}
        this.selected.forEach(s => loc[s] = refs[s].current.getSize())
        const xs = Object.values(loc).map(l => l.x)
        const ys = Object.values(loc).map(l => l.y)
        const xs_ = Object.values(loc).map(l => l.x + l.w)
        const ys_ = Object.values(loc).map(l => l.y + l.h)
        const sorted = Object.keys(loc).sort(function (a, b) { return type == 'v' ? (loc[a].y - loc[b].y) : (loc[a].x - loc[b].x) })
        const miny = type == 'v' ? Math.min(...ys) : Math.min(...xs)
        const maxy = type == 'v' ? Math.max(...ys_) : Math.max(...xs_)
        const totalh = Object.values(loc).map(l => type == 'v' ? l.h : l.w).reduce((total, num) => total + num)
        const dis = (maxy - miny - totalh) / (this.selected.length - 1)
        if (dis < 0)
            return
        let offset = miny
        sorted.forEach((s, i) => { refs[s].current.setSize(type == 'v' ? 'y' : 'x', offset + i * dis); offset += (type == 'v' ? loc[s].h : loc[s].w) })
        this.snapshot()

    }
    handleKeyDown(e) {
        if (this.ignore)
            return
        const scale = this.state.zoom
        const { refs } = this.state
        if (e.shiftKey) {
            if (e.key == 'v' || e.key == 'V') {
                this.distribute('v')
            } else if (e.key == 'h' || e.key == 'H') {
                this.distribute('h')
            }
        }
        if (e.key === "PageUp") {
            this.arrange('front')
        } else if (e.key === "PageDown") {
            this.arrange('back')
        }
        let dx = 0, dy = 0
        let xs = [], ys = [], xs_ = [], ys_ = []
        this.selected.forEach(s => { const loc = refs[s].current.getSize(); xs.push(loc.x); xs_.push(loc.x + loc.w); ys.push(loc.y); ys_.push(loc.y + loc.h) })
        let type = null
        switch (e.key) {
            case "Up":
            case "ArrowUp":
                dy = -1
                type = 'top'
                break
            case "Down":
            case "ArrowDown":
                dy = 1
                type = 'bottom'
                break
            case "Right":
            case "ArrowRight":
                dx = 1
                type = "right"
                break
            case "Left":
            case "ArrowLeft":
                dx = -1
                type = 'left'
                break
        }
        if (e.shiftKey && type) this.align(type)
        else this.selected.forEach(s => refs[s].current.move(scale * dx, scale * dy))
        if (dx != 0 || dy != 0)
            this.snapshot()
        this.ignore = true
        setTimeout(() => { this.ignore = false }, 10)
    }
    handlekeyUp(e) {
        if (this.multiCopy.length > 0) {
            this.props.changeTool(null, 'Move')
            this.multiCopy.forEach(c => this.select(c))
            this.multiCopy = []
        }
    }

    handleShapeChange() {
        this.snapshot()
        this.isTexting = false
    }
    snapshot() {
        const { elements } = this.state
        if (this.currentState < this.history.length - 1) {
            this.history = this.history.slice(0, this.currentState + 1)
        }
        this.history.push(elements.map(e => { return ({ id: e.id, type: e.e.type, ref: e.e.ref, state: JSON.stringify(e.e.ref.current.state), props: e.e.ref.current.props }) }))
        this.currentState++
    }
    handleSave() {
        var svg = this.canvas.current
        var serializer = new XMLSerializer();
        var source = serializer.serializeToString(svg);
        const { bgColor } = this.state
        //add name spaces.
        source = source.replace(/style="/, `style="background: ${bgColor};`);
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
            const { elements, refs, count } = this.state
            const ref = React.createRef()
            let element = null
            refs[count] = ref
            let props = JSON.parse(node.attribs.props)
            props['id'] = count
            props['key'] = count
            props['ref'] = ref
            props['clickInside'] = this.handleClickInside
            props['deselect'] = this.handleDeselect
            props['handleBoundryClick'] = this.handleBoundryClick
            props['updateLayout'] = this.handleLayoutUpdate
            if (node.attribs.element === "Shape") {
                element = React.createElement(Shape, props)
            } else if (node.attribs.element === "Line") {
                props['changeShape'] = this.handleShapeChange
                element = React.createElement(Line, props)
            } else if (node.attribs.element === "Text") {
                element = React.createElement(Text, props)
            }
            this.setState({ elements: [...elements, { id: count, e: element }], refs, count: count + 1 })
        }
    }
    onLoad(e) {
        var file = e.target.files[0];
        var reader = new FileReader();
        this.setState({ elements: [], boundingBox: {}, refs: {}, count: 0 })

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
        let refs = {}
        const elements = this.history[this.currentState].map((s, i) => { refs[s.id] = s.ref; return ({ id: s.id, e: React.createElement(s.type, { ...s.props, ...JSON.parse(s.state), key: s.id, ref: s.ref }) }) })
        this.selected = []
        this.setState({ elements: [], refs: {}, boundingBox: {} },
            () => this.setState({ elements, refs }))
    }
    handleRedo() {
        if (this.currentState > this.history.length - 2) return
        this.currentState++
        let refs = {}
        const elements = this.history[this.currentState].map((s, i) => { refs[s.id] = s.ref; return ({ id: s.id, e: React.createElement(s.type, { ...s.props, ...JSON.parse(s.state), key: s.id, ref: s.ref }) }) })
        this.selected = []
        this.setState({ elements: [], refs: {}, boundingBox: {} },
            () => this.setState({ elements, refs }))
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
        // console.log('render')

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
                        style={{ display: 'block', outline: 'none' }}
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
                            {/* <div style={{ width: "20px", height: "20px", margin: '0 10px' }} dangerouslySetInnerHTML={{ __html: zoomin }} /> */}
                            <img src={zoomin} />
                            <CustomSlider
                                value={zoom}
                                min={0.5}
                                max={2}
                                step={0.1}
                                onChange={this.handleChangeZoom}
                                style={{ width: '100px', padding: 0 }} />
                            {/* <div style={{ width: "20px", height: "20px", margin: '0 10px' }} dangerouslySetInnerHTML={{ __html: zoomout }} /> */}
                            <img src={zoomout} />
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