import * as fs from 'fs';
import * as path from 'path';
import * as xml2js from 'xml2js';

interface Property {
    name: string;
    value: string | number;
}
interface Event {
    type: string;
    pos: [number, number];
    properties: Property[];
    file: [string, number, number];
}

const mapFilePath = 'tilemaps/example.tmx';
const outputFilePath = 'parser.json';
const mapData = fs.readFileSync(mapFilePath, 'utf8');
const parser = new xml2js.Parser();

parser.parseString(mapData, (err: Error | null, result) => {
    if (err) {
        console.error(err);
        return;
    }
    const map = result.map;
    const jsonOutput: any = {
        layer_count: 0,
        layers: {},
        events: [] as Event[]
    };

    if (Array.isArray(map.layer)) {
        jsonOutput.layer_count = map.layer.length;
        map.layer.forEach((layer: any) => {
            const layerName = layer.$.name;
            const layerData = layer.data[0]._.split(',').map(Number);
            const width = parseInt(layer.$.width, 10);
            const height = parseInt(layer.$.height, 10);
            const twoDArray = [] as number[][];
            for (let i = 0; i < height; i++) {
                twoDArray.push(layerData.slice(i * width, i * width + width));
            }
            jsonOutput.layers[layerName] = twoDArray;
        });
    }
    
    if (Array.isArray(map.objectgroup)) {
        map.objectgroup.forEach((group: any) => {
            if (Array.isArray(group.object)) {
                group.object.forEach((obj: any) => {
                    const type = obj.$.type;
                    const pos: [number, number] = [parseFloat(obj.$.x) / 32, parseFloat(obj.$.y) / 32];
                    var properties = [] as Property[];
                    obj.properties[0].property.forEach((prop: any) => {
                        const name = prop.$.name;
                        var value = prop.$.value;
                        if (prop.$.type !== undefined && prop.$.type !== null) {
                            if (prop.$.type === 'bool') {
                                value = value === 'true';
                            }
                            else if (prop.$.type === 'int') {
                                value = parseInt(value, 10);
                            }
                            else if (prop.$.type === 'float') {
                                value = parseFloat(value);
                            }
                        }
                        properties.push({ name, value });
                    });
                    const gid = parseInt(obj.$.gid, 10);
                    const tileset = map.tileset.find((ts: any) => parseInt(ts.$.firstgid, 10) <= gid && gid < parseInt(ts.$.firstgid, 10) + parseInt(ts.$.tilecount, 10));

                    let filename = '';
                    if (tileset && tileset.image && tileset.image[0] && tileset.image[0].$ && tileset.image[0].$.source) {
                        filename = tileset.image[0].$.source.split('/').pop() || '';
                    }
                    else if (tileset && tileset.tile && Array.isArray(tileset.tile)) {
                        const matchingTile = tileset.tile.find((tile: any) => parseInt(tile.$.id, 10) + parseInt(tileset.$.firstgid, 10) === gid);
                        if (matchingTile && matchingTile.image && matchingTile.image[0] && matchingTile.image[0].$ && matchingTile.image[0].$.source) {
                            filename = matchingTile.image[0].$.source.split('/').pop() || '';
                        }
                    }
                    const fileParts = filename.split('_');
                    const file: [string, number, number] = [fileParts[0], parseInt(fileParts[1], 10), parseInt(fileParts[2], 10)];

                    jsonOutput.events.push({ type, pos, properties, file });
                });
            }
        });
    }

    fs.writeFileSync(outputFilePath, JSON.stringify(jsonOutput, null, 2));
    console.log(`File written to ${path.resolve(outputFilePath)}`);
});
